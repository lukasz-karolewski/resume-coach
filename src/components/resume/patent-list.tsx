import type { RouterOutputs } from "~/trpc/shared";
import { ResumeItemActions } from "./resume-item-controls";

type Patent = RouterOutputs["resume"]["getById"]["patents"][number];

export function PatentList({
  patents,
  onEdit,
  onDelete,
}: {
  patents: Patent[];
  onEdit?: (patent: Patent) => void;
  onDelete?: (patent: Patent) => void;
}) {
  return patents.map((patent) => (
    <div
      className="group/item relative grid break-inside-avoid grid-cols-[1fr_auto] gap-x-4 text-sm"
      key={patent.id}
    >
      <span className="font-bold">
        {patent.link ? <a href={patent.link}>{patent.title}</a> : patent.title}
      </span>
      <time dateTime={patent.date.toISOString()}>
        {patent.date.toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
          year: "numeric",
        })}
      </time>
      <span className="col-span-2">{patent.description}</span>
      <ResumeItemActions
        className="col-span-2"
        label={`patent ${patent.title}`}
        onDelete={onDelete && (() => onDelete(patent))}
        onEdit={onEdit && (() => onEdit(patent))}
      />
    </div>
  ));
}
