import { PencilSquareIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { formatFromTo, toYearMonthsDuration } from "~/app/utils";
import { Button } from "~/components/ui/button";
import { MarkdownContent } from "~/components/ui/markdownContent";
import type { RouterOutputs } from "~/trpc/shared";

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
}

interface JobExperienceItemProps {
  job: JobExperienceItem;
  onEditPosition?: (position: Position, companyName: string) => void;
}

interface JobExperienceProps {
  jobs: JobExperienceItem[];
  onEditPosition?: (position: Position, companyName: string) => void;
}

const Accomplishments: React.FC<AccomplishmentsProps> = ({ markdown }) => {
  return (
    <div className="text-sm list-decimal list-inside">
      <MarkdownContent>{markdown}</MarkdownContent>
    </div>
  );
};

const PositionItem: React.FC<PositionItemProps> = ({
  companyName,
  position,
  onEditPosition,
}) => {
  const { startDate, endDate, title, location, accomplishments } = position;
  const { formattedFrom, formattedTo } = formatFromTo(startDate, endDate);

  return (
    <div className="group/item relative">
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
      {onEditPosition ? (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={`Edit experience ${title} at ${companyName}`}
          className="absolute -top-1 -right-7 opacity-0 transition-opacity group-hover/item:opacity-100 focus:opacity-100 print:hidden"
          onClick={() => onEditPosition(position, companyName)}
        >
          <PencilSquareIcon />
        </Button>
      ) : null}
    </div>
  );
};

const JobExperienceItem: React.FC<JobExperienceItemProps> = ({
  job,
  onEditPosition,
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
}) => {
  return (
    <>
      {jobs.map((job) => (
        <JobExperienceItem
          key={job.id}
          job={job}
          onEditPosition={onEditPosition}
        />
      ))}
    </>
  );
};

export default JobExperience;
