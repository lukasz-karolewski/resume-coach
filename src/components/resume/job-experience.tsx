import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Markdown from "markdown-to-jsx";

import { formatFromTo, toYearMonthsDuration } from "~/app/utils";

dayjs.extend(duration);

interface Position {
  startDate: Date;
  endDate?: Date | null;
  title: string;
  location: string;
  accomplishments: string[];
}

interface JobExperienceItem {
  companyName: string;
  link?: string | null;
  positions: Position[];
}

interface AccomplishmentsProps {
  items: string[];
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

const Accomplishments: React.FC<AccomplishmentsProps> = ({ items }) => {
  if (items.length === 1) {
    return (
      <p className="text-sm">
        <Markdown>{items[0]}</Markdown>
      </p>
    );
  }

  return (
    <ul className="ml-6 list-disc break-before-avoid text-sm">
      {items.map((item, index) => {
        const trimmed = item.trim();
        if (trimmed.startsWith("**")) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: tbd
            <span key={index}>
              <Markdown>{trimmed}</Markdown>
            </span>
          );
        }
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: tbd
          <li key={index}>
            <Markdown>{trimmed}</Markdown>
          </li>
        );
      })}
    </ul>
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
      <Accomplishments items={accomplishments} />
      {/* <button
        onClick={async () => {
          await getReview(
            {
              thread_id,
              accomplihments: accomplishments,
              user_input: "Coach me on how to improve this",
            },
            {
              onSuccess: (data) => {
                console.log(data);
              },
              onError: (error) => {
                console.error(error);
              },
            },
          );
        }}
      >
        review
      </button> */}
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
        {positions.map((position, index) => (
          <PositionItem
            // biome-ignore lint/suspicious/noArrayIndexKey: tbd
            key={index}
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
      {jobs.map((job, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: tbd
        <JobExperienceItem key={index} job={job} />
      ))}
    </>
  );
};

export default JobExperience;
