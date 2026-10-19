import { formatFromTo } from "~/app/utils";
import type { RouterOutputs } from "~/trpc/shared";
import { ResumeItemActions } from "./resume-item-controls";

type EducationExperience =
  RouterOutputs["resume"]["getById"]["education"][number];

interface EducationExperienceItemProps {
  info: EducationExperience;
  onEdit?: (education: EducationExperience) => void;
  onDelete?: (education: EducationExperience) => void;
}

interface EducationExperienceProps {
  educationList: EducationExperience[];
  onEdit?: (education: EducationExperience) => void;
  onDelete?: (education: EducationExperience) => void;
}

function EducationExperienceItem({
  info,
  onEdit,
  onDelete,
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
      <ResumeItemActions
        className="col-span-2"
        label={`${type === "CERTIFICATION" ? "certification" : "education"} at ${institution}`}
        onDelete={onDelete && (() => onDelete(info))}
        onEdit={onEdit && (() => onEdit(info))}
      />
    </div>
  );
}

export default function EducationExperience({
  educationList,
  onEdit,
  onDelete,
}: EducationExperienceProps) {
  return (
    <>
      {educationList.map((education) => (
        <EducationExperienceItem
          key={education.id}
          info={education}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}
