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

const Assistant: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const pathname = usePathname();
  const router = useRouter();

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
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }, []);

  // Load threadId from sessionStorage on mount
  useEffect(() => {
    const savedThreadId = sessionStorage.getItem("chatThreadId");
    if (savedThreadId) {
      setThreadId(savedThreadId);
    }
    void loadConversations();
  }, [loadConversations]);

  const resumePathMatch = pathname?.match(/^\/resume\/(-?\d+)$/);
  const resumeId = resumePathMatch ? Number(resumePathMatch[1]) : undefined;

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
      sessionStorage.setItem("chatThreadId", newThreadId);
      void loadConversations();
    },
    onViewResume: (nextResumeId) => {
      setThreadId(undefined);
      sessionStorage.removeItem("chatThreadId");
      resetChat();
      router.push(`/resume/${nextResumeId}`);
    },
    resumeId,
    threadId,
  });

  const handleNewThread = () => {
    setThreadId(undefined);
    sessionStorage.removeItem("chatThreadId");
    resetChat();
  };

  const handleSelectConversation = (nextThreadId: string | undefined) => {
    if (!nextThreadId) {
      handleNewThread();
      return;
    }

    setThreadId(nextThreadId);
    sessionStorage.setItem("chatThreadId", nextThreadId);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all print:hidden"
          aria-label="Open chat"
        >
          <ChatIcon className="w-6 h-6" />
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
