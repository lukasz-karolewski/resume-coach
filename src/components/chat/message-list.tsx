import { useEffect, useRef } from "react";
import { Message } from "./message";
import { ThinkingIndicator } from "./thinking-indicator";
import type { ChatMessage, ToolExecution } from "./use-chat-stream";

interface MessageListProps {
  messages: ChatMessage[];
  currentChunk?: string;
  toolExecutions?: ToolExecution[];
}

export function MessageList({
  messages,
  currentChunk,
  toolExecutions = [],
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef({ chunk: "", messages: 0, tools: 0 });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const hasChanges =
      prevLengthRef.current.messages !== messages.length ||
      prevLengthRef.current.chunk !== currentChunk ||
      prevLengthRef.current.tools !== toolExecutions.length;

    if (hasChanges && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      prevLengthRef.current = {
        chunk: currentChunk || "",
        messages: messages.length,
        tools: toolExecutions.length,
      };
    }
  });

  const activeToolExecutions = toolExecutions.filter(
    (t) => t.status === "started",
  );

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">Resume Coach</p>
            <p className="text-sm mt-2">
              Ask me to review your resume, analyze job descriptions, or make
              improvements!
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <Message key={message.id ?? message.content} message={message} />
      ))}

      {currentChunk && (
        <Message
          message={{
            content: currentChunk,
            role: "assistant",
          }}
          isStreaming
        />
      )}

      {activeToolExecutions.map((tool) => (
        <div key={tool.id} className="flex justify-start mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
            <ThinkingIndicator tool={tool.tool} />
          </div>
        </div>
      ))}
    </div>
  );
}
