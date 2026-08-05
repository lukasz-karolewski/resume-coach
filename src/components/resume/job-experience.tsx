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
  onEditAccomplishments?: (position: Position) => void;
}

interface JobExperienceItemProps {
  job: JobExperienceItem;
  onEditAccomplishments?: (position: Position) => void;
}

interface JobExperienceProps {
  jobs: JobExperienceItem[];
  onEditAccomplishments?: (position: Position) => void;
}

const Accomplishments: React.FC<AccomplishmentsProps> = ({ markdown }) => {
  return (
    <div className="text-sm list-decimal list-inside">
      <MarkdownContent>{markdown}</MarkdownContent>
    </div>
  );
};

const PositionItem: React.FC<PositionItemProps> = ({
  position,
  onEditAccomplishments,
}) => {
  const { startDate, endDate, title, location, accomplishments } = position;
  const { formattedFrom, formattedTo } = formatFromTo(startDate, endDate);

  return (
    <div className="">
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
      <div
        className="group/accomplishments relative rounded-sm outline-none focus-within:ring-2 focus-within:ring-ring/50"
        onDoubleClick={() => onEditAccomplishments?.(position)}
      >
        <Accomplishments markdown={accomplishments} />
        {onEditAccomplishments ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label={`Edit accomplishments for ${title}`}
            className="absolute -top-1 -right-7 opacity-0 transition-opacity group-hover/accomplishments:opacity-100 focus:opacity-100 print:hidden"
            onClick={() => onEditAccomplishments(position)}
          >
            <PencilSquareIcon />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

const JobExperienceItem: React.FC<JobExperienceItemProps> = ({
  job,
  onEditAccomplishments,
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
            onEditAccomplishments={onEditAccomplishments}
          />
        ))}
      </div>
    </div>
  );
};

const JobExperience: React.FC<JobExperienceProps> = ({
  jobs,
  onEditAccomplishments,
}) => {
  return (
    <>
      {jobs.map((job) => (
        <JobExperienceItem
          key={job.id}
          job={job}
          onEditAccomplishments={onEditAccomplishments}
        />
      ))}
    </>
  );
};

export default JobExperience;
