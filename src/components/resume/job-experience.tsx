import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { formatFromTo, toYearMonthsDuration } from "~/app/utils";
import { MarkdownContent } from "~/components/ui/markdownContent";
import type { RouterOutputs } from "~/trpc/shared";

dayjs.extend(duration);

type JobExperienceItem =
  RouterOutputs["resume"]["getResume"]["experience"][number];

type Position = JobExperienceItem["positions"][number];

interface AccomplishmentsProps {
  markdown: string;
}

interface PositionItemProps {
  companyName: string;
  link?: string | null;
  position: Position;
}

interface JobExperienceItemProps {
  job: JobExperienceItem;
}

interface JobExperienceProps {
  jobs: JobExperienceItem[];
}

const Accomplishments: React.FC<AccomplishmentsProps> = ({ markdown }) => {
  return (
    <div className="text-sm list-decimal list-inside">
      <MarkdownContent>{markdown}</MarkdownContent>
    </div>
  );
};

const PositionItem: React.FC<PositionItemProps> = ({ position }) => {
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
      <Accomplishments markdown={accomplishments} />
    </div>
  );
};

const JobExperienceItem: React.FC<JobExperienceItemProps> = ({ job }) => {
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
          />
        ))}
      </div>
    </div>
  );
};

const JobExperience: React.FC<JobExperienceProps> = ({ jobs }) => {
  return (
    <>
      {jobs.map((job) => (
        <JobExperienceItem key={job.id} job={job} />
      ))}
    </>
  );
};

export default JobExperience;
