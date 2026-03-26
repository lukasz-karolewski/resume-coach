import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/auth";
import { db } from "~/server/db";
import { listChatThreads } from "~/server/lib/chat";

function parseResumeId(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    throw new Error("Invalid resumeId");
  }

  return parsedValue;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resumeId = parseResumeId(
      request.nextUrl.searchParams.get("resumeId"),
    );
    const threads = await listChatThreads(db, session.user.id, resumeId);
    return NextResponse.json({ threads });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid resumeId") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
