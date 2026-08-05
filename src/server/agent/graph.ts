"server-only";

import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage } from "langchain";
import * as z from "zod";
import { db } from "../db";
import { createChatMessage } from "../lib/chat";
import { myDynamicSystemPromptMiddleware } from "./prompt";
import { allTools } from "./tools";

const redisUrl = process.env.REDIS_URL ?? "redis://redis:6379";

let checkpointerPromise: Promise<
  Awaited<ReturnType<typeof RedisSaver.fromUrl>>
> | null = null;

const model = new ChatOpenAI({
  model: "gpt-5.4",
  outputVersion: "v1",
  useResponsesApi: true,
});

export const contextSchema = z.object({
  currentResumeId: z.number().nullable(),
  userId: z.string(),
});

export const stateSchema = z.object({
  preferences: z.record(z.string(), z.any()),
});

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
  signal?: AbortSignal;
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
  signal,
}: ChatStreamParams): Promise<{ threadId: string }> {
  const persistedResumeId = resumeId ?? null;

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
  await createChatMessage(db, {
    content: message,
    role: "user",
    threadId: thread.id,
  });

  let assistantMessage = "";

  const run = await agent.streamEvents(
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
      signal,
      version: "v3",
    },
  );

  const consumeMessages = async () => {
    for await (const streamedMessage of run.messages) {
      for await (const content of streamedMessage.text) {
        if (!content) {
          continue;
        }

        assistantMessage += content;
        await sendEvent("chunk", { content });
      }
    }
  };

  const consumeToolCalls = async () => {
    for await (const toolCall of run.toolCalls) {
      await sendEvent("tool_start", {
        input: toolCall.input,
        runId: toolCall.callId,
        tool: toolCall.name,
      });

      const status = await toolCall.status;
      const error = await toolCall.error;
      const output = status === "finished" ? await toolCall.output : undefined;

      await sendEvent("tool_end", {
        error,
        output,
        runId: toolCall.callId,
        status,
        tool: toolCall.name,
      });
    }
  };

  await Promise.all([consumeMessages(), consumeToolCalls(), run.output]);

  if (assistantMessage) {
    await createChatMessage(db, {
      content: assistantMessage,
      role: "assistant",
      threadId: thread.id,
    });
  }

  await sendEvent("done", {
    threadId: thread.id,
  });

  return { threadId: thread.id };
}
