"use client";;
import { use } from "react";

import ContactInfo from "~/components/resume/contact-info";
import EducationExperience from "~/components/resume/education-experience";
import JobExperience from "~/components/resume/job-experience";
import { ProfessionalSummary } from "~/components/resume/professional-summary";
import Section from "~/components/resume/section";
import { api } from "~/trpc/react";

export default function ResumePage(
  props: {
    params: Promise<{ resume_id: string }>;
  }
) {
  const params = use(props.params);
  const { data: resume } = api.resume.getResume.useQuery({
    company_name: params.resume_id,
    version: "v1",
  });

  if (!resume) {
    return <div>Loading...</div>;
  }

  return (
    <div className="m-auto flex max-w-4xl flex-col gap-8 bg-white p-12 shadow-lg dark:bg-gray-800 print:p-0 print:shadow-none">
      <ContactInfo contactInfo={resume.contactInfo} />

      <Section title="Summary">
        <ProfessionalSummary info={resume.professionalSummary} />
      </Section>

      <Section title="Experience">
        <JobExperience jobs={resume.experience} />
      </Section>

      <Section title="Education" layout="compact">
        <EducationExperience educationList={resume.education} />
      </Section>

      <Section title="Certificates" layout="compact">
        <EducationExperience educationList={resume.certificates} />
      </Section>
    </div>
  );
}
