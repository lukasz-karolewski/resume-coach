"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChatIcon } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { ChatWindow } from "./chat/chat-window";
import { useChatStream } from "./chat/use-chat-stream";

interface ConversationSummary {
  createdAt: string;
  id: string;
  summary: string;
}

// One active conversation for the whole app: the assistant follows the user
// from page to page instead of restarting on every resume.
const CHAT_THREAD_STORAGE_KEY = "chatThreadId";

const Assistant: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const pathname = usePathname();
  const router = useRouter();
  const resumePathMatch = pathname?.match(/^\/resume\/([A-Za-z0-9]{6})$/);
  const resumeId = resumePathMatch?.[1];

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/threads");

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
          sessionStorage.removeItem(CHAT_THREAD_STORAGE_KEY);
          return undefined;
        }

        return currentThreadId;
      });
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }, []);

  useEffect(() => {
    const savedThreadId = sessionStorage.getItem(CHAT_THREAD_STORAGE_KEY);
    setThreadId(savedThreadId ?? undefined);
    void loadConversations();
  }, [loadConversations]);

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
    onOpenResume: (nextResumeId) => {
      // Keep the thread and its messages: the assistant carries on talking
      // about the resume the user just landed on.
      if (nextResumeId === resumeId) {
        return;
      }

      router.push(`/resume/${nextResumeId}`);
    },
    onThreadCreated: (newThreadId) => {
      setThreadId(newThreadId);
      sessionStorage.setItem(CHAT_THREAD_STORAGE_KEY, newThreadId);
      void loadConversations();
    },
    resumeId,
    threadId,
  });

  const handleNewThread = () => {
    setThreadId(undefined);
    sessionStorage.removeItem(CHAT_THREAD_STORAGE_KEY);
    resetChat();
  };

  const handleSelectConversation = (nextThreadId: string | undefined) => {
    if (!nextThreadId) {
      handleNewThread();
      return;
    }

    setThreadId(nextThreadId);
    sessionStorage.setItem(CHAT_THREAD_STORAGE_KEY, nextThreadId);
  };

  return (
    <>
      {!isOpen && (
        <Button
          data-testid="assistant-launcher"
          onClick={() => setIsOpen(true)}
          className="fixed right-5 bottom-5 h-12 w-12 rounded-2xl border-border/70 bg-card text-foreground shadow-lg shadow-black/5 hover:bg-muted print:hidden"
          size="icon"
          variant="outline"
          aria-label="Open chat"
        >
          <ChatIcon className="h-5 w-5" />
        </Button>
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
