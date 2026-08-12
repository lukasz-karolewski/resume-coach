import { PencilSquareIcon } from "@heroicons/react/20/solid";
import { formatFromTo } from "~/app/utils";
import { Button } from "~/components/ui/button";
import type { RouterOutputs } from "~/trpc/shared";

type EducationExperience =
  RouterOutputs["resume"]["getById"]["education"][number];

interface EducationExperienceItemProps {
  info: EducationExperience;
  onEdit?: (education: EducationExperience) => void;
}

interface EducationExperienceProps {
  educationList: EducationExperience[];
  onEdit?: (education: EducationExperience) => void;
}

function EducationExperienceItem({
  info,
  onEdit,
}: EducationExperienceItemProps) {
  const {
    distinction,
    institution,
    link,
    location,
    startDate,
    endDate,
    notes,
    type,
  } = info;
  const { formattedFrom, formattedTo } = formatFromTo(startDate, endDate, true);

  const timeframe =
    formattedFrom !== formattedTo
      ? `${formattedFrom} - ${formattedTo}`
      : formattedFrom;

  return (
    <div className="group/item relative grid break-inside-avoid grid-cols-[1fr_auto] gap-x-4 text-sm">
      <span className="font-bold">
        {link ? <a href={link}>{institution}</a> : institution}
      </span>
      <span className="text-right">{timeframe}</span>
      <span className="col-span-2">{distinction}</span>
      <span className="col-span-2 text-xs text-gray-600">{location}</span>
      {notes ? (
        <span className="col-span-2 text-xs italic">{notes}</span>
      ) : null}
      {onEdit ? (
        <Button
          aria-label={`Edit ${type === "CERTIFICATION" ? "certification" : "education"} at ${institution}`}
          className="absolute top-0 -right-7 opacity-0 transition-opacity group-hover/item:opacity-100 focus:opacity-100 print:hidden"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={() => onEdit(info)}
        >
          <PencilSquareIcon />
        </Button>
      ) : null}
    </div>
  );
}

export default function EducationExperience({
  educationList,
  onEdit,
}: EducationExperienceProps) {
  return (
    <>
      {educationList.map((education) => (
        <EducationExperienceItem
          key={education.id}
          info={education}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}
