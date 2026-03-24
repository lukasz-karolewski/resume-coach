const resumeSortOptions = {
  created: "Created",
  "last-updated": "Last updated",
  name: "Name",
} as const;

type ResumeSort = keyof typeof resumeSortOptions;

function normalizeResumeSort(value?: string | string[]): ResumeSort {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (normalizedValue === "created") {
    return "created";
  }

  if (normalizedValue === "name") {
    return "name";
  }

  return "last-updated";
}

export type { ResumeSort };
export { normalizeResumeSort, resumeSortOptions };
