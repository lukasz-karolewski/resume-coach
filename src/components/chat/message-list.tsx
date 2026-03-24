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
    <div
      ref={scrollRef}
      className="flex-1 space-y-3 overflow-y-auto bg-background/60 px-4 py-4"
    >
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="max-w-sm text-center">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Resume Coach
            </p>
            <p className="mt-2 text-sm leading-6">
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
        <div key={tool.id} className="mb-4 flex justify-start">
          <div className="rounded-2xl border border-border bg-muted/60 px-4 py-2.5">
            <ThinkingIndicator tool={tool.tool} />
          </div>
        </div>
      ))}
    </div>
  );
}
