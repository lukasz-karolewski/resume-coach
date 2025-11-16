"server-only";

import { HumanMessage } from "@langchain/core/messages";
import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { db } from "../db";
import { systemPrompt } from "./prompt";
import { CoachAgentContext } from "./state";
import { allTools } from "./tools";

const checkpointer = await RedisSaver.fromUrl("redis://localhost:6379");

/**
 * Create the ReAct agent graph
 */
export function createCoachAgent() {
  const model = new ChatOpenAI({
    frequencyPenalty: 0,
    model: "gpt-4o-mini",
    presencePenalty: 0,
    temperature: 0.1,
  });

  const agent = createAgent({
    checkpointer,
    contextSchema: CoachAgentContext,
    model,
    systemPrompt,
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
        resumeId: resumeId ?? null,
        userId,
      },
    });
  }

  const agent = createCoachAgent();

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

  // Invoke the agent with streaming
  const input = {
    messages: [new HumanMessage(message)],
    testValue: "DEADBEEF",
  };

  // let assistantMessage = "";

  // Stream events from the agent
  for await (const event of agent.streamEvents(input, {
    configurable: {
      thread_id: thread.id,
    },
    context: {
      currentResumeId: resumeId ?? null,
      userId,
    },
    version: "v2",
  })) {
    // Handle different event types
    if (event.event === "on_chat_model_stream") {
      // LLM is streaming a response
      const chunk = event.data?.chunk;
      if (chunk?.content) {
        // assistantMessage += chunk.content;
        await sendEvent("chunk", {
          content: chunk.content,
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
