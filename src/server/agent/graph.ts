"server-only";

import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage } from "langchain";
import * as z from "zod";
import { db } from "../db";
import { myDynamicSystemPromptMiddleware } from "./prompt";
import { allTools } from "./tools";

const redisUrl = process.env.REDIS_URL ?? "redis://redis:6379";

let checkpointerPromise: Promise<
  Awaited<ReturnType<typeof RedisSaver.fromUrl>>
> | null = null;

const model = new ChatOpenAI({
  model: "gpt-5.4",
  useResponsesApi: true,
});

export const contextSchema = z.object({
  currentResumeId: z.number().nullable(),
  userId: z.string(),
});

export const stateSchema = z.object({
  preferences: z.record(z.string(), z.any()),
});

function extractTextFromChunkContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(extractTextFromChunkContent).join("");
  }

  if (content && typeof content === "object") {
    if (
      "type" in content &&
      content.type === "text" &&
      "text" in content &&
      typeof content.text === "string"
    ) {
      return content.text;
    }

    if (
      "type" in content &&
      content.type === "output_text" &&
      "text" in content &&
      typeof content.text === "string"
    ) {
      return content.text;
    }
  }

  return "";
}

async function getCheckpointer() {
  checkpointerPromise ??= RedisSaver.fromUrl(redisUrl).catch((error) => {
    checkpointerPromise = null;
    throw error;
  });

  return checkpointerPromise;
}

export async function createCoachAgent() {
  const checkpointer = await getCheckpointer();

  const agent = createAgent({
    checkpointer,
    contextSchema,
    middleware: [myDynamicSystemPromptMiddleware],
    model,
    stateSchema,
    tools: allTools,
  });

  return agent;
}

/**
 * SSE event sender helper type
 */
type SendEvent = (event: string, data: unknown) => Promise<void>;

/**
 * Parameters for the chat stream
 */
interface ChatStreamParams {
  message: string;
  threadId?: string;
  resumeId?: number;
  userId: string;
  sendEvent: SendEvent;
}

/**
 * Execute the chat agent and stream responses
 * This handles:
 * - Finding or creating chat thread
 * - Storing user message
 * - Running the agent with streaming
 * - Storing assistant response
 * - Sending SSE events
 */
export async function executeChatStream({
  threadId,
  resumeId,
  userId,
  message,
  sendEvent,
}: ChatStreamParams): Promise<{ threadId: string }> {
  const persistedResumeId =
    resumeId !== undefined && resumeId > 0 ? resumeId : null;

  // Find or create chat thread
  let thread = threadId
    ? await db.chatThread.findFirst({
        where: {
          id: threadId,
          userId,
        },
      })
    : null;

  if (!thread) {
    thread = await db.chatThread.create({
      data: {
        resumeId: persistedResumeId,
        userId,
      },
    });
  }

  const agent = await createCoachAgent();

  // // Store the user message
  // await db.chatMessage.create({
  //   data: {
  //     content: message,
  //     role: "user",
  //     threadId: thread.id,
  //   },
  // });

  // await sendEvent("message", {
  //   content: message,
  //   role: "user",
  // });

  // let assistantMessage = "";

  // Stream events from the agent
  // TODO migrate to use stream() and Standard content blocks
  // https://docs.langchain.com/oss/javascript/langchain/messages#content-block-reference
  for await (const event of agent.streamEvents(
    {
      messages: [new HumanMessage(message)],
      preferences: {},
    },
    {
      configurable: {
        thread_id: thread.id,
      },
      context: {
        currentResumeId: resumeId ?? null,
        userId,
      },
      version: "v2",
    },
  )) {
    // Handle different event types https://v03.api.js.langchain.com/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#streamEvents
    if (event.event === "on_chat_model_stream") {
      // LLM is streaming a response
      const chunk = event.data?.chunk;
      const content = extractTextFromChunkContent(chunk?.content);
      if (content) {
        // assistantMessage += chunk.content;
        await sendEvent("chunk", {
          content,
        });
      }
    } else if (event.event === "on_tool_start") {
      // Tool execution started
      await sendEvent("tool_start", {
        input: event.data?.input,
        runId: event.run_id,
        tool: event.name,
      });
    } else if (event.event === "on_tool_end") {
      // Tool execution ended
      await sendEvent("tool_end", {
        output: event.data?.output,
        runId: event.run_id,
        tool: event.name,
      });
    }
  }

  // // Store the assistant's final message
  // if (assistantMessage) {
  //   await db.chatMessage.create({
  //     data: {
  //       content: assistantMessage,
  //       role: "assistant",
  //       threadId: thread.id,
  //     },
  //   });
  // }

  await sendEvent("done", {
    threadId: thread.id,
  });

  return { threadId: thread.id };
}
