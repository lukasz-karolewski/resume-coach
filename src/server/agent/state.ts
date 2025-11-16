"server-only";

import { MessagesZodState } from "@langchain/langgraph";
import * as z from "zod";

/**
 * Runtime context schema for the ReAct agent
 * This context is accessible to tools via config.context
 * and is passed during agent invocation.
 */
export const CoachAgentContext = z.object({
  currentResumeId: z.number().nullable(),
  userId: z.string(),
});

/**
 * Custom state schema for the agent
 * Extends the default MessagesZodState with custom fields
 * that can be read and modified during agent execution.
 */
export const CoachAgentState = z.object({
  messages: MessagesZodState.shape.messages,
  // Custom state field example - can be modified by tools
  testValue: z.string().optional(),
});
