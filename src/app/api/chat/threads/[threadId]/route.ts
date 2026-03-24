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
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Conversation not found" ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
