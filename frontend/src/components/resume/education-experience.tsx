import { formatFromTo } from "~/app/utils";

interface EducationExperience {
  distinction: string;
  institution: string;
  link?: string;
  location: string;
  startDate: Date;
  endDate?: Date;
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
    institution: school,
    location,
    link,
    startDate,
    endDate,
  } = info;
  const { formattedFrom, formattedTo } = formatFromTo(
    info.startDate,
    info.endDate,
  );
  const timeframe = `${formattedFrom} - ${formattedTo}`;

  return (
    <div className="flex break-inside-avoid flex-col text-sm">
      <div className="flex justify-between">
        <strong>{school}</strong>
        <span>{timeframe}</span>
      </div>
      {link ? <a href={link}>{distinction}</a> : <span>{distinction}</span>}
    </div>
  );
}

export default function EducationExperience({
  educationList,
}: EducationExperienceProps) {
  return (
    <div>
      {educationList.map((education, index) => (
        <EducationExperienceItem key={index} info={education} />
      ))}
    </div>
  );
}
