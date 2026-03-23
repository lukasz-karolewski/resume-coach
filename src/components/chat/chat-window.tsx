import { PlusIcon, XIcon } from "~/components/icons";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import type { ChatMessage, ToolExecution } from "./use-chat-stream";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStopMessage: () => void;
  isLoading: boolean;
  currentChunk?: string;
  toolExecutions?: ToolExecution[];
  sessionId?: string;
  onClose: () => void;
  error?: string | null;
  onNewThread: () => void;
}

export function ChatWindow({
  messages,
  onSendMessage,
  onStopMessage,
  isLoading,
  currentChunk,
  toolExecutions,
  sessionId,
  onClose,
  error,
  onNewThread,
}: ChatWindowProps) {
  return (
    <div className="fixed bottom-4 right-4 flex h-[min(48rem,calc(100vh-2rem))] w-[min(48rem,calc(100vw-2rem))] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b p-4 dark:border-gray-700">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Resume Coach
          </h3>
          <p className="truncate font-mono text-xs text-gray-500 dark:text-gray-400">
            {sessionId ?? "Waiting for first response"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewThread}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            aria-label="Start new conversation"
            title="Start new conversation"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            aria-label="Close chat"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        currentChunk={currentChunk}
        toolExecutions={toolExecutions}
      />

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        onStop={onStopMessage}
        disabled={isLoading}
      />
    </div>
  );
}
