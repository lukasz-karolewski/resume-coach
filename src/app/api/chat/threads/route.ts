import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "~/auth";
import { db } from "~/server/db";
import { listChatThreads } from "~/server/lib/chat";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const threads = await listChatThreads(db, session.user.id);
    return NextResponse.json({ threads });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
