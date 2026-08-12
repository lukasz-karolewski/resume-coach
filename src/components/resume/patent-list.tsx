import { PencilSquareIcon } from "@heroicons/react/20/solid";
import { Button } from "~/components/ui/button";
import type { RouterOutputs } from "~/trpc/shared";

type Patent = RouterOutputs["resume"]["getById"]["patents"][number];

export function PatentList({
  patents,
  onEdit,
}: {
  patents: Patent[];
  onEdit?: (patent: Patent) => void;
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
      {onEdit ? (
        <Button
          aria-label={`Edit patent ${patent.title}`}
          className="absolute top-0 -right-7 opacity-0 transition-opacity group-hover/item:opacity-100 focus:opacity-100 print:hidden"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={() => onEdit(patent)}
        >
          <PencilSquareIcon />
        </Button>
      ) : null}
    </div>
  ));
}
