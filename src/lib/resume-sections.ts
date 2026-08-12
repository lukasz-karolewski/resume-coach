export const RESUME_SECTION_TYPES = [
  "EXPERIENCE",
  "EDUCATION",
  "CERTIFICATION",
  "SKILLS_SUMMARY",
  "PATENTS",
] as const;

export type ResumeSectionType = (typeof RESUME_SECTION_TYPES)[number];

const RESUME_SECTION_LABELS: Record<ResumeSectionType, string> = {
  CERTIFICATION: "Certifications",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
  PATENTS: "Patents",
  SKILLS_SUMMARY: "Skills",
};

export const resumeSectionOptions: ReadonlyArray<{
  itemLabel: string;
  label: string;
  type: ResumeSectionType;
}> = [
  { itemLabel: "experience", label: "Experience", type: "EXPERIENCE" },
  { itemLabel: "education", label: "Education", type: "EDUCATION" },
  {
    itemLabel: "certification",
    label: "Certifications",
    type: "CERTIFICATION",
  },
  { itemLabel: "skill", label: "Skills", type: "SKILLS_SUMMARY" },
  { itemLabel: "patent", label: "Patents", type: "PATENTS" },
];

export function getResumeSectionLabel(type: ResumeSectionType) {
  return RESUME_SECTION_LABELS[type];
}
