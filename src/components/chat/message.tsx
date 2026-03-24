import Markdown from "markdown-to-jsx";
import type { ChatMessage } from "./use-chat-stream";

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function Message({ message, isStreaming }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${
          isUser
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/70 bg-card text-card-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:leading-6">
            <Markdown>{message.content}</Markdown>
          </div>
        )}
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-current" />
        )}
      </div>
    </div>
  );
}
