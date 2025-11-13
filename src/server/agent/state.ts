import type { BaseMessage } from "@langchain/core/messages";
import { MessagesAnnotation } from "@langchain/langgraph";

/**
 * Extended state for the ReAct agent
 * Includes conversation messages and metadata about the working resume
 */
export interface AgentState {
  messages: BaseMessage[];
  resumeId: number | null;
  userId: string;
}

/**
 * Use MessagesAnnotation as base and extend with custom fields
 */
export const CoachAgentAnnotation = MessagesAnnotation.spec;
