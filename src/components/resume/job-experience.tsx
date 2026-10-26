import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { formatFromTo, toYearMonthsDuration } from "~/app/utils";
import { MarkdownContent } from "~/components/ui/markdownContent";
import type { RouterOutputs } from "~/trpc/shared";
import { ResumeItemActions } from "./resume-item-controls";

dayjs.extend(duration);

type JobExperienceItem =
  RouterOutputs["resume"]["getById"]["experience"][number];

type Position = JobExperienceItem["positions"][number];

interface AccomplishmentsProps {
  markdown: string;
}

interface PositionItemProps {
  companyName: string;
  link?: string | null;
  position: Position;
  onEditPosition?: (position: Position, companyName: string) => void;
  onDeletePosition?: (position: Position) => void;
}

interface JobExperienceItemProps {
  job: JobExperienceItem;
  onEditPosition?: (position: Position, companyName: string) => void;
  onDeletePosition?: (position: Position) => void;
}

interface JobExperienceProps {
  jobs: JobExperienceItem[];
  onEditPosition?: (position: Position, companyName: string) => void;
  onDeletePosition?: (position: Position) => void;
}

const Accomplishments: React.FC<AccomplishmentsProps> = ({ markdown }) => {
  return (
    <div className="list-inside list-decimal text-sm">
      <MarkdownContent>{markdown}</MarkdownContent>
    </div>
  );
};

const PositionItem: React.FC<PositionItemProps> = ({
  companyName,
  position,
  onEditPosition,
  onDeletePosition,
}) => {
  const { startDate, endDate, title, location, accomplishments } = position;
  const { formattedFrom, formattedTo } = formatFromTo(startDate, endDate);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="mb-2 flex w-max flex-col">
          <span className="font-bold">{title}</span>
          <span className="text-sm">{location}</span>
        </div>
        <span className="text-sm font-bold">
          {toYearMonthsDuration(startDate, endDate)} &bull; {formattedFrom} -{" "}
          {formattedTo}
        </span>
      </div>
      <div>
        <Accomplishments markdown={accomplishments} />
      </div>
      <ResumeItemActions
        label={`experience ${title} at ${companyName}`}
        onDelete={onDeletePosition && (() => onDeletePosition(position))}
        onEdit={onEditPosition && (() => onEditPosition(position, companyName))}
      />
    </div>
  );
};

const JobExperienceItem: React.FC<JobExperienceItemProps> = ({
  job,
  onEditPosition,
  onDeletePosition,
}) => {
  const { companyName, link, positions } = job;
  const hasMultiplePositions = positions.length > 1;

  return (
    <div className="">
      <div className="mb-2 flex items-center justify-between font-bold">
        <h2>{!link ? companyName : <a href={link}>{companyName}</a>}</h2>
      </div>
      <div
        className={`flex break-before-avoid flex-col gap-6 ${hasMultiplePositions ? "border-l-2 pl-4" : ""}`}
      >
        {positions.map((position) => (
          <PositionItem
            key={position.id}
            companyName={companyName}
            link={link}
            position={position}
            onDeletePosition={onDeletePosition}
            onEditPosition={onEditPosition}
          />
        ))}
      </div>
    </div>
  );
};

const JobExperience: React.FC<JobExperienceProps> = ({
  jobs,
  onEditPosition,
  onDeletePosition,
}) => {
  return (
    <>
      {jobs.map((job) => (
        <JobExperienceItem
          key={job.id}
          job={job}
          onDeletePosition={onDeletePosition}
          onEditPosition={onEditPosition}
        />
      ))}
    </>
  );
};

export default JobExperience;
