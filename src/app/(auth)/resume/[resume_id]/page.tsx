import { notFound } from "next/navigation";
import ResumeDetailClient from "~/components/resume/resume-detail-client";
import { api } from "~/trpc/server";

export default async function ResumePage(props: {
  params: Promise<{ resume_id: string }> | { resume_id: string };
}) {
  const params = await props.params;
  const resumeId = Number.parseInt(params.resume_id, 10);

  if (Number.isNaN(resumeId)) {
    notFound();
  }

  const resume = await api.resume.getById.query({ id: resumeId });

  return <ResumeDetailClient resume={resume} />;
}
