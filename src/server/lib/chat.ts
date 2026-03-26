"server-only";

import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "~/generated/prisma/client";

const DEFAULT_CONVERSATION_SUMMARY = "New conversation";

function summarizeConversation(content: string | null | undefined) {
  if (!content) {
    return DEFAULT_CONVERSATION_SUMMARY;
  }

  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return DEFAULT_CONVERSATION_SUMMARY;
  }

  return normalized.slice(0, 100);
}

export async function listChatThreads(
  db: PrismaClient,
  userId: string,
  resumeId?: number,
) {
  const threads = await db.chatThread.findMany({
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        where: {
          role: "user",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    where: {
      ...(resumeId !== undefined ? { resumeId } : {}),
      userId,
    },
  });

  return threads.map((thread) => ({
    createdAt: thread.createdAt,
    id: thread.id,
    summary: summarizeConversation(thread.messages[0]?.content),
  }));
}

export async function getChatThreadMessages(
  db: PrismaClient,
  userId: string,
  threadId: string,
) {
  const thread = await db.chatThread.findFirst({
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    where: {
      id: threadId,
      userId,
    },
  });

  if (!thread) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Conversation not found",
    });
  }

  return {
    createdAt: thread.createdAt,
    id: thread.id,
    messages: thread.messages.map((message) => ({
      content: message.content,
      createdAt: message.createdAt,
      id: message.id,
      role: message.role,
    })),
  };
}

export async function createChatMessage(
  db: PrismaClient,
  input: {
    content: string;
    role: string;
    threadId: string;
  },
) {
  return db.chatMessage.create({
    data: input,
  });
}
