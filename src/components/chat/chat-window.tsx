import { PlusIcon, XIcon } from "~/components/icons";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import type { ChatMessage, ToolExecution } from "./use-chat-stream";

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
  return (
    <div
      data-testid="assistant-panel"
      className="fixed bottom-5 right-5 flex h-[min(66vh,48rem)] w-[min(32rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/95 text-card-foreground shadow-2xl shadow-black/10 backdrop-blur supports-[backdrop-filter]:bg-card/90"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-muted/40 px-5 py-4">
        <div className="min-w-0 space-y-2">
          <div>
            <h3 className="font-semibold tracking-tight">Resume Coach</h3>
            <p className="text-sm text-muted-foreground">
              Review, rewrite, and target this resume faster.
            </p>
          </div>
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
