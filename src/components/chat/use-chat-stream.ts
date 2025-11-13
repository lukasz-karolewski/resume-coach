import { useCallback, useEffect, useRef, useState } from "react";

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

interface UseChatStreamOptions {
  threadId?: string;
  resumeId?: number;
  onThreadCreated?: (threadId: string) => void;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChunk, setCurrentChunk] = useState("");
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { threadId, resumeId, onThreadCreated } = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      abortControllerRef.current?.abort();
    };
  }, []);

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

      try {
        // Create abort controller
        abortControllerRef.current = new AbortController();

        // Send POST request to start streaming
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
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to use the chat");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Read the SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        let buffer = "";
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let i = 0;
          while (i < lines.length) {
            const line = lines[i];
            if (line.startsWith("event:")) {
              const eventType = line.substring(6).trim();
              // Next line should be data
              if (i + 1 < lines.length && lines[i + 1]?.startsWith("data:")) {
                const data = JSON.parse(lines[i + 1].substring(5).trim());

                switch (eventType) {
                  case "chunk": {
                    assistantContent += data.content;
                    setCurrentChunk(assistantContent);
                    break;
                  }
                  case "tool_start":
                    setToolExecutions((prev) => [
                      ...prev,
                      {
                        id:
                          data.runId ??
                          `${data.tool}-${Date.now()}-${Math.random()}`,
                        input: data.input,
                        status: "started",
                        tool: data.tool,
                      },
                    ]);
                    break;
                  case "tool_end":
                    setToolExecutions((prev) =>
                      prev.map((t) =>
                        t.id === data.runId ||
                        (t.tool === data.tool && t.status === "started")
                          ? {
                              ...t,
                              output: data.output,
                              status: "ended" as const,
                            }
                          : t,
                      ),
                    );
                    break;
                  case "done":
                    if (data.threadId && onThreadCreated) {
                      onThreadCreated(data.threadId);
                    }
                    break;
                  case "error":
                    setError(data.message);
                    break;
                }
                i += 2; // Skip both event and data lines
              } else {
                i++;
              }
            } else {
              i++;
            }
          }
        }

        // Add complete assistant message
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
        setIsLoading(false);
      }
    },
    [isLoading, threadId, resumeId, onThreadCreated],
  );

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    eventSourceRef.current?.close();
    setIsLoading(false);
  }, []);

  const resetChat = useCallback(() => {
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
