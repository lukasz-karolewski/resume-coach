import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/auth";
import { executeChatStream } from "~/server/agent";

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
      resumeId?: number;
    };

    const { message, threadId, resumeId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE event
    const sendEvent = async (event: string, data: unknown) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Execute the chat stream in the background
    (async () => {
      try {
        await executeChatStream({
          message,
          resumeId,
          sendEvent,
          threadId,
          userId,
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
