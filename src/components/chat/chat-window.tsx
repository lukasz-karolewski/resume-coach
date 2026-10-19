import { useRef } from "react";
import { PlusIcon, XIcon } from "~/components/icons";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import type { ChatMessage, ToolExecution } from "./use-chat-stream";
import { useVisualViewport } from "./use-visual-viewport";

interface ConversationOption {
  createdAt: string;
  id: string;
  summary: string;
}

interface ChatWindowProps {
  conversations: ConversationOption[];
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStopMessage: () => void;
  onSelectConversation: (threadId: string | undefined) => void;
  isLoading: boolean;
  currentChunk?: string;
  toolExecutions?: ToolExecution[];
  sessionId?: string;
  onClose: () => void;
  error?: string | null;
  onNewThread: () => void;
}

export function ChatWindow({
  conversations,
  messages,
  onSendMessage,
  onStopMessage,
  onSelectConversation,
  isLoading,
  currentChunk,
  toolExecutions,
  sessionId,
  onClose,
  error,
  onNewThread,
}: ChatWindowProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useVisualViewport(panelRef);

  return (
    // Phones get a full-screen panel sized to the visual viewport so the input
    // stays above the on-screen keyboard; larger screens get a floating card.
    <div
      ref={panelRef}
      data-testid="assistant-panel"
      className="fixed inset-x-0 top-[var(--visual-viewport-top,0px)] z-40 flex h-[var(--visual-viewport-height,100dvh)] flex-col overflow-hidden overscroll-contain bg-card text-card-foreground sm:top-auto sm:right-5 sm:bottom-5 sm:left-auto sm:h-[min(66vh,48rem)] sm:w-[min(32rem,calc(100vw-2rem))] sm:rounded-3xl sm:border sm:border-border/70 sm:bg-card/95 sm:shadow-2xl sm:shadow-black/10 sm:backdrop-blur sm:supports-[backdrop-filter]:bg-card/90"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-muted/40 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-semibold tracking-tight">Resume Coach</h3>
          <select
            aria-label="Select conversation"
            className="w-full truncate rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm outline-hidden transition-colors focus:border-ring"
            value={sessionId ?? ""}
            onChange={(event) =>
              onSelectConversation(event.target.value || undefined)
            }
          >
            <option value="">New conversation</option>
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {`${new Date(conversation.createdAt).toLocaleDateString()} - ${conversation.summary}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onNewThread}
            size="icon"
            variant="ghost"
            aria-label="Start new conversation"
            title="Start new conversation"
          >
            <PlusIcon className="size-5" />
          </Button>
          <Button
            onClick={onClose}
            size="icon"
            variant="ghost"
            aria-label="Close chat"
          >
            <XIcon className="size-5" />
          </Button>
        </div>
      </div>

      {error ? (
        <Alert className="mx-4 mt-3 w-auto" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <MessageList
        key={sessionId ?? "new-conversation"}
        messages={messages}
        currentChunk={currentChunk}
        isStreaming={isLoading}
        toolExecutions={toolExecutions}
      />

      <ChatInput
        onSend={onSendMessage}
        onStop={onStopMessage}
        disabled={isLoading}
      />
    </div>
  );
}
