"use client";

import { use } from "react";

import ContactInfo from "~/components/resume/contact-info";
import EducationExperience from "~/components/resume/education-experience";
import JobExperience from "~/components/resume/job-experience";
import { ProfessionalSummary } from "~/components/resume/professional-summary";
import Section from "~/components/resume/section";
import { EducationType } from "~/generated/prisma/client";
import { api } from "~/trpc/react";

export default function ResumePage(props: {
  params: Promise<{ resume_id: string }>;
}) {
  const params = use(props.params);

  // Try to parse as number (for database resumes with numeric IDs)
  const numericId = Number.parseInt(params.resume_id, 10);
  const isNumericId = !Number.isNaN(numericId);

  // Use getById for numeric IDs, getResume for string names
  const { data: resumeById } = api.resume.getById.useQuery(
    { id: numericId },
    { enabled: isNumericId },
  );

  const { data: resumeByName } = api.resume.getResume.useQuery(
    {
      company_name: params.resume_id,
      version: "v1",
    },
    { enabled: !isNumericId },
  );

  const resume = resumeById || resumeByName;

  if (!resume) {
    return <div>Loading...</div>;
  }

  const education = resume.education.filter(
    (e) => e.type === EducationType.EDUCATION,
  );
  const certificates = resume.education.filter(
    (e) => e.type === EducationType.CERTIFICATION,
  );

  return (
    <div className="m-auto flex max-w-4xl flex-col gap-8 bg-white p-12 shadow-lg dark:bg-gray-800 print:p-0 print:shadow-none">
      <ContactInfo contactInfo={resume.contactInfo} />

      <Section title="Summary">
        <ProfessionalSummary info={resume.summary} />
      </Section>

      <Section title="Experience">
        <JobExperience jobs={resume.experience} />
      </Section>

      <Section title="Education" layout="compact">
        <EducationExperience educationList={education} />
      </Section>

      <Section title="Certificates" layout="compact">
        <EducationExperience educationList={certificates} />
      </Section>
    </div>
  );
}
