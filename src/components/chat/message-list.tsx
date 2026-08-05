import { CircleNotchIcon } from "@phosphor-icons/react";
import Markdown from "markdown-to-jsx";
import { Bubble, BubbleContent } from "~/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "~/components/ui/marker";
import {
  MessageContent,
  Message as MessagePrimitive,
} from "~/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "~/components/ui/message-scroller";
import type { ChatMessage, ToolExecution } from "./use-chat-stream";

interface MessageListProps {
  messages: ChatMessage[];
  currentChunk?: string;
  isStreaming?: boolean;
  toolExecutions?: ToolExecution[];
}

function ChatMessageRow({
  isStreaming = false,
  message,
}: {
  isStreaming?: boolean;
  message: ChatMessage;
}) {
  const isUser = message.role === "user";

  return (
    <MessagePrimitive align={isUser ? "end" : "start"}>
      <MessageContent>
        <Bubble
          align={isUser ? "end" : "start"}
          variant={isUser ? "default" : "secondary"}
        >
          <BubbleContent>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:leading-6">
                <Markdown>{message.content}</Markdown>
              </div>
            )}
            {isStreaming ? (
              <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
            ) : null}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </MessagePrimitive>
  );
}

export function MessageList({
  messages,
  currentChunk,
  isStreaming = false,
  toolExecutions = [],
}: MessageListProps) {
  const activeToolExecutions = toolExecutions.filter(
    (tool) => tool.status === "started",
  );

  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="flex-1 bg-background/60">
        <MessageScrollerViewport>
          <MessageScrollerContent
            aria-busy={isStreaming}
            className="gap-3 px-4 py-4"
          >
            {messages.length === 0 ? (
              <MessageScrollerItem className="flex min-h-full items-center justify-center">
                <div className="max-w-sm text-center text-muted-foreground">
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    Resume Coach
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    Ask me to review your resume, analyze a job description, or
                    improve a specific section.
                  </p>
                </div>
              </MessageScrollerItem>
            ) : null}

            {messages.map((message) => (
              <MessageScrollerItem
                key={message.id ?? message.content}
                messageId={message.id}
                scrollAnchor={message.role === "user"}
              >
                <ChatMessageRow message={message} />
              </MessageScrollerItem>
            ))}

            {currentChunk ? (
              <MessageScrollerItem messageId="streaming-assistant">
                <ChatMessageRow
                  isStreaming
                  message={{ content: currentChunk, role: "assistant" }}
                />
              </MessageScrollerItem>
            ) : null}

            {activeToolExecutions.map((tool) => (
              <MessageScrollerItem key={tool.id} messageId={tool.id}>
                <Marker>
                  <MarkerIcon>
                    <CircleNotchIcon className="animate-spin" />
                  </MarkerIcon>
                  <MarkerContent>Using {tool.tool}…</MarkerContent>
                </Marker>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton behavior="smooth" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
