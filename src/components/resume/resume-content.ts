type EducationEntry = {
  type: string;
};

export function partitionResumeEducation<T extends EducationEntry>(
  entries: readonly T[],
) {
  const education: T[] = [];
  const certificates: T[] = [];

  for (const entry of entries) {
    if (entry.type === "EDUCATION") {
      education.push(entry);
    } else if (entry.type === "CERTIFICATION") {
      certificates.push(entry);
    }
  }

  return { certificates, education };
}

export type ResumeTextBlock = {
  kind: "bullet" | "paragraph";
  text: string;
};

const IMAGE_PATTERN = /!\[([^\]]*)\]\([^)]*\)/g;
const LINK_PATTERN = /\[([^\]]+)\]\([^)]*\)/g;
const LIST_ITEM_PATTERN = /^\s*(?:[-+*]|\d+[.)])\s+(.+)$/;

function removeInlineMarkdown(value: string) {
  return value
    .replace(IMAGE_PATTERN, "$1")
    .replace(LINK_PATTERN, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/^#{1,6}\s+/, "")
    .trim();
}

export function toResumeTextBlocks(markdown: string): ResumeTextBlock[] {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const listItem = line.match(LIST_ITEM_PATTERN);
    const text = removeInlineMarkdown(listItem?.[1] ?? line);

    if (!text) {
      return [];
    }

    return [
      {
        kind: listItem ? "bullet" : "paragraph",
        text,
      } satisfies ResumeTextBlock,
    ];
  });
}
