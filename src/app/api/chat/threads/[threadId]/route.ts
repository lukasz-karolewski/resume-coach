import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "~/auth";
import { db } from "~/server/db";
import { getChatThreadMessages } from "~/server/lib/chat";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/chat/threads/[threadId]">,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId } = await context.params;
    const thread = await getChatThreadMessages(db, session.user.id, threadId);
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof Error && error.message === "Conversation not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
