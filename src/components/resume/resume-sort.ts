const resumeSortOptions = {
  "last-updated": "Last updated",
  name: "Name",
} as const;

type ResumeSort = keyof typeof resumeSortOptions;

type ResumeCard = {
  name: string;
  updatedAt: Date | string;
};

function getResumeSort(value?: string | string[]): ResumeSort {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (normalizedValue === "name") {
    return "name";
  }

  return "last-updated";
}

function sortResumes<T extends ResumeCard>(resumes: T[], sort: ResumeSort): T[] {
  return [...resumes].sort((left, right) => {
    if (sort === "name") {
      return left.name.localeCompare(right.name);
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

export { getResumeSort, resumeSortOptions, sortResumes };
export type { ResumeSort };
