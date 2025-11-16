"use client";

import { useEffect, useState } from "react";
import { ChatWindow } from "./chat/chat-window";
import { useChatStream } from "./chat/use-chat-stream";

const Assistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();

  // Load threadId from sessionStorage on mount
  useEffect(() => {
    const savedThreadId = sessionStorage.getItem("chatThreadId");
    if (savedThreadId) {
      setThreadId(savedThreadId);
    }
  }, []);

  // resume/id
  const resumeId =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/resume/")
      ? Number(window.location.pathname.split("/").filter(Boolean)[1])
      : undefined;

  const {
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
    },
    resumeId,
    threadId,
  });

  const handleNewThread = () => {
    setThreadId(undefined);
    sessionStorage.removeItem("chatThreadId");
    resetChat();
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all print:hidden"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          currentChunk={currentChunk}
          toolExecutions={toolExecutions}
          error={error}
          onClose={() => setIsOpen(false)}
          onNewThread={handleNewThread}
        />
      )}
    </>
  );
};

export default Assistant;
