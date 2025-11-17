import { PlusIcon, XIcon } from "~/components/icons";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import type { ChatMessage, ToolExecution } from "./use-chat-stream";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  currentChunk?: string;
  toolExecutions?: ToolExecution[];
  onClose: () => void;
  error?: string | null;
  onNewThread: () => void;
}

export function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  currentChunk,
  toolExecutions,
  onClose,
  error,
  onNewThread,
}: ChatWindowProps) {
  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Resume Coach
          </h3>
          <p className="text-xs text-gray-500">AI-powered career assistant</p>
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
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
