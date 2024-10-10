import { formatFromTo } from "~/app/utils";

interface EducationExperience {
  distinction: string;
  institution: string;
  link?: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

interface EducationExperienceItemProps {
  info: EducationExperience;
}

interface EducationExperienceProps {
  educationList: EducationExperience[];
}

function EducationExperienceItem({ info }: EducationExperienceItemProps) {
  const {
    distinction,
    institution,
    location,
    link,
    startDate,
    endDate,
    notes,
  } = info;
  const { formattedFrom, formattedTo } = formatFromTo(startDate, endDate, true);

  const timeframe =
    formattedFrom !== formattedTo
      ? `${formattedFrom} - ${formattedTo}`
      : formattedFrom;

  return (
    <div className="grid break-inside-avoid grid-cols-[1fr_auto] gap-x-4 text-sm">
      <span className="font-bold">
        {link ? <a href={link}>{institution}</a> : institution}
      </span>
      <span className="text-right">{timeframe}</span>
      <span className="col-span-2">{distinction}</span>
      {notes && <span className="text-xs italic">{notes}</span>}
    </div>
  );
}

export default function EducationExperience({
  educationList,
}: EducationExperienceProps) {
  return (
    <>
      {educationList.map((education, index) => (
        <EducationExperienceItem key={index} info={education} />
      ))}
    </>
  );
}
