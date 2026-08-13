import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PublicResumeClient from "~/components/resume/public-resume-client";
import { db } from "~/server/db";
import { getPublicResumeBySlug } from "~/server/lib/resume-permalink";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Shared resume",
};

export default async function PublicResumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const resume = await getPublicResumeBySlug(db, slug);

  if (!resume) notFound();

  return <PublicResumeClient resume={resume} />;
}
