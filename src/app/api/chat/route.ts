import { HumanMessage } from "@langchain/core/messages";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/auth";
import { createCoachAgent } from "~/server/agent";
import { db } from "~/server/db";

/**
 * POST /api/chat
 * Streaming SSE endpoint for chat with the resume coach agent
 */
export async function POST(req: NextRequest) {
  // Authenticate the user
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  try {
    // Parse request body
    const body = (await req.json()) as {
      message: string;
      threadId?: string;
      resumeId?: number;
    };

    const { message, threadId, resumeId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Find or create chat thread
    let thread:
      | Awaited<ReturnType<typeof db.chatThread.findFirst>>
      | Awaited<ReturnType<typeof db.chatThread.create>>;
    if (threadId) {
      thread = await db.chatThread.findFirst({
        where: {
          id: threadId,
          userId,
        },
      });

      if (!thread) {
        return NextResponse.json(
          { error: "Thread not found" },
          { status: 404 },
        );
      }
    } else {
      // Create new thread
      thread = await db.chatThread.create({
        data: {
          resumeId: resumeId ?? null,
          userId,
        },
      });
    }

    // Create the agent
    const agent = createCoachAgent();

    // Prepare configuration for the agent
    const config = {
      configurable: {
        thread_id: thread.id,
      },
    };

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE event
    const sendEvent = async (event: string, data: unknown) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Run the agent in the background
    (async () => {
      try {
        // Store the user message
        await db.chatMessage.create({
          data: {
            content: message,
            role: "user",
            threadId: thread.id,
          },
        });

        await sendEvent("message", {
          content: message,
          role: "user",
        });

        // Invoke the agent with streaming
        const input = {
          messages: [new HumanMessage(message)],
        };

        let assistantMessage = "";

        // Stream events from the agent
        for await (const event of agent.streamEvents(input, {
          ...config,
          version: "v2",
        })) {
          // Handle different event types
          if (event.event === "on_chat_model_stream") {
            // LLM is streaming a response
            const chunk = event.data?.chunk;
            if (chunk?.content) {
              assistantMessage += chunk.content;
              await sendEvent("chunk", {
                content: chunk.content,
              });
            }
          } else if (event.event === "on_tool_start") {
            // Tool execution started
            await sendEvent("tool_start", {
              input: event.data?.input,
              runId: event.run_id,
              tool: event.name,
            });
          } else if (event.event === "on_tool_end") {
            // Tool execution ended
            await sendEvent("tool_end", {
              output: event.data?.output,
              runId: event.run_id,
              tool: event.name,
            });
          }
        }

        // Store the assistant's final message
        if (assistantMessage) {
          await db.chatMessage.create({
            data: {
              content: assistantMessage,
              role: "assistant",
              threadId: thread.id,
            },
          });
        }

        await sendEvent("done", {
          threadId: thread.id,
        });
      } catch (error) {
        console.error("Agent error:", error);
        await sendEvent("error", {
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        await writer.close();
      }
    })();

    // Return the SSE stream
    return new NextResponse(stream.readable, {
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
