import { useCallback, useEffect, useRef, useState } from "react";
import { parseSseStream } from "./parse-sse-stream";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
}

export interface ToolExecution {
  id: string;
  tool: string;
  input?: unknown;
  output?: unknown;
  status: "started" | "ended";
}

export interface ConversationMessage {
  content: string;
  createdAt: string;
  id: string;
  role: "assistant" | "system" | "user";
}

interface UseChatStreamOptions {
  threadId?: string;
  resumeId?: number;
  onThreadCreated?: (threadId: string) => void;
  onOpenResume?: (resumeId: number) => void;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChunk, setCurrentChunk] = useState("");
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipThreadLoadRef = useRef<string | null>(null);

  const { threadId, resumeId, onThreadCreated, onOpenResume } = options;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setCurrentChunk("");
      setToolExecutions([]);
      setError(null);
      return;
    }

    if (skipThreadLoadRef.current === threadId) {
      skipThreadLoadRef.current = null;
      return;
    }

    const controller = new AbortController();
    setMessages([]);
    setCurrentChunk("");
    setToolExecutions([]);
    setError(null);

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/threads/${threadId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load conversation: ${response.status}`);
        }

        const data = (await response.json()) as {
          messages: ConversationMessage[];
        };

        setMessages(
          data.messages.map((message) => ({
            content: message.content,
            id: message.id,
            role: message.role,
          })),
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load conversation history";
        setError(errorMessage);
      }
    };

    void loadMessages();

    return () => {
      controller.abort();
    };
  }, [threadId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setCurrentChunk("");
      setToolExecutions([]);

      // Add user message immediately
      const userMessage: ChatMessage = {
        content,
        id: `user-${Date.now()}`,
        role: "user",
      };
      setMessages((prev) => [...prev, userMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          body: JSON.stringify({
            message: content,
            resumeId,
            threadId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to use the chat");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("The chat response did not include a stream");
        }

        let assistantContent = "";

        for await (const event of parseSseStream(response.body)) {
          const data = event.data as Record<string, unknown>;

          switch (event.type) {
            case "chunk": {
              if (typeof data.content === "string") {
                assistantContent += data.content;
                setCurrentChunk(assistantContent);
              }
              break;
            }
            case "tool_start": {
              if (typeof data.tool === "string") {
                const toolName = data.tool;
                setToolExecutions((prev) => [
                  ...prev,
                  {
                    id:
                      typeof data.runId === "string"
                        ? data.runId
                        : `${toolName}-${Date.now()}`,
                    input: data.input,
                    status: "started",
                    tool: toolName,
                  },
                ]);
              }
              break;
            }
            case "tool_end": {
              setToolExecutions((prev) =>
                prev.map((tool) =>
                  tool.id === data.runId ||
                  (tool.tool === data.tool && tool.status === "started")
                    ? {
                        ...tool,
                        output: data.output,
                        status: "ended" as const,
                      }
                    : tool,
                ),
              );
              break;
            }
            case "navigate": {
              // The agent keeps streaming while the app routes to the resume,
              // so the conversation survives the navigation.
              if (typeof data.resumeId === "number") {
                onOpenResume?.(data.resumeId);
              }
              break;
            }
            case "done": {
              if (typeof data.threadId === "string") {
                if (data.threadId !== threadId) {
                  skipThreadLoadRef.current = data.threadId;
                }
                onThreadCreated?.(data.threadId);
              }
              break;
            }
            case "error": {
              if (typeof data.message === "string") {
                setError(data.message);
              }
              break;
            }
          }
        }

        if (assistantContent) {
          setMessages((prev) => [
            ...prev,
            {
              content: assistantContent,
              id: `assistant-${Date.now()}`,
              role: "assistant",
            },
          ]);
        }

        setCurrentChunk("");
        setToolExecutions([]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        console.error("Chat error:", err);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [isLoading, threadId, resumeId, onThreadCreated, onOpenResume],
  );

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const resetChat = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setCurrentChunk("");
    setToolExecutions([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    cancelRequest,
    currentChunk,
    error,
    isLoading,
    messages,
    resetChat,
    sendMessage,
    toolExecutions,
  };
}
