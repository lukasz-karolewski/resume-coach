import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/auth";
import { executeChatStream } from "~/server/agent/graph";

/**
 * POST /api/chat
 * Streaming SSE endpoint for chat with the resume coach agent
 */
export async function POST(req: NextRequest) {
  // Authenticate the user
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Parse request body
    const body = (await req.json()) as {
      message: string;
      threadId?: string;
      resumeId?: string;
    };

    const { message, threadId, resumeId } = body;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const encoder = new TextEncoder();
    const responseAbortController = new AbortController();
    const signal = AbortSignal.any([
      req.signal,
      responseAbortController.signal,
    ]);
    const stream = new ReadableStream<Uint8Array>({
      cancel() {
        responseAbortController.abort();
      },
      async start(controller) {
        const sendEvent = async (event: string, data: unknown) => {
          signal.throwIfAborted();
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        };

        try {
          await executeChatStream({
            message: message.trim(),
            resumeId,
            sendEvent,
            signal,
            threadId,
            userId,
          });
        } catch (error) {
          if (!signal.aborted) {
            console.error("Agent error:", error);
            await sendEvent("error", {
              message: error instanceof Error ? error.message : "Unknown error",
            });
          }
        } finally {
          if (!signal.aborted) {
            controller.close();
          }
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
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
