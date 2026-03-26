"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChatIcon } from "~/components/icons";
import { ChatWindow } from "./chat/chat-window";
import { useChatStream } from "./chat/use-chat-stream";

interface ConversationSummary {
  createdAt: string;
  id: string;
  summary: string;
}

function getChatThreadStorageKey(resumeId?: number) {
  return resumeId === undefined
    ? "chatThreadId"
    : `chatThreadId:resume:${resumeId}`;
}

function getChatThreadsUrl(resumeId?: number) {
  if (resumeId === undefined) {
    return "/api/chat/threads";
  }

  const searchParams = new URLSearchParams({
    resumeId: String(resumeId),
  });
  return `/api/chat/threads?${searchParams.toString()}`;
}

const Assistant: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const pathname = usePathname();
  const router = useRouter();
  const resumePathMatch = pathname?.match(/^\/resume\/(-?\d+)$/);
  const resumeId = resumePathMatch ? Number(resumePathMatch[1]) : undefined;
  const chatThreadStorageKey = getChatThreadStorageKey(resumeId);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(getChatThreadsUrl(resumeId));

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = (await response.json()) as {
        threads: ConversationSummary[];
      };
      setConversations(data.threads);
      setThreadId((currentThreadId) => {
        if (
          currentThreadId &&
          !data.threads.some(
            (conversation) => conversation.id === currentThreadId,
          )
        ) {
          sessionStorage.removeItem(chatThreadStorageKey);
          return undefined;
        }

        return currentThreadId;
      });
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }, [chatThreadStorageKey, resumeId]);

  useEffect(() => {
    const savedThreadId = sessionStorage.getItem(chatThreadStorageKey);
    setThreadId(savedThreadId ?? undefined);
    void loadConversations();
  }, [chatThreadStorageKey, loadConversations]);

  const {
    cancelRequest,
    messages,
    isLoading,
    error,
    sendMessage,
    currentChunk,
    toolExecutions,
    resetChat,
  } = useChatStream({
    onThreadCreated: (newThreadId) => {
      setThreadId(newThreadId);
      sessionStorage.setItem(chatThreadStorageKey, newThreadId);
      void loadConversations();
    },
    onViewResume: (nextResumeId) => {
      setThreadId(undefined);
      resetChat();
      router.push(`/resume/${nextResumeId}`);
    },
    resumeId,
    threadId,
  });

  const handleNewThread = () => {
    setThreadId(undefined);
    sessionStorage.removeItem(chatThreadStorageKey);
    resetChat();
  };

  const handleSelectConversation = (nextThreadId: string | undefined) => {
    if (!nextThreadId) {
      handleNewThread();
      return;
    }

    setThreadId(nextThreadId);
    sessionStorage.setItem(chatThreadStorageKey, nextThreadId);
  };

  return (
    <>
      {!isOpen && (
        <button
          data-testid="assistant-launcher"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-card text-foreground shadow-lg shadow-black/5 transition-colors hover:bg-muted print:hidden"
          aria-label="Open chat"
        >
          <ChatIcon className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <ChatWindow
          conversations={conversations}
          messages={messages}
          onSendMessage={sendMessage}
          onStopMessage={cancelRequest}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoading}
          currentChunk={currentChunk}
          toolExecutions={toolExecutions}
          sessionId={threadId}
          error={error}
          onClose={() => setIsOpen(false)}
          onNewThread={handleNewThread}
        />
      )}
    </>
  );
};

export default Assistant;
