import { headers } from "next/headers";
import { auth } from "~/auth";
import { db } from "~/server/db";
import { getResumeMarkdown } from "~/server/lib/resume";

function createMarkdownFilename(resumeId: string) {
  return `resume-${resumeId}.md`;
}

export async function GET(
  _request: Request,
  context: RouteContext<"/resume/[resume_id]/markdown">,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return new Response("Unauthorized", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      status: 401,
    });
  }

  const { resume_id: resumeIdParam } = await context.params;
  const resumeId = Number.parseInt(resumeIdParam, 10);

  if (Number.isNaN(resumeId)) {
    return new Response("Resume not found", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      status: 404,
    });
  }

  try {
    const markdown = await getResumeMarkdown(db, session.user.id, {
      id: resumeId,
    });

    return new Response(markdown, {
      headers: {
        "Content-Disposition": `inline; filename="${createMarkdownFilename(resumeIdParam)}"`,
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Resume not found" ? 404 : 500;

    return new Response(message, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      status,
    });
  }
}
