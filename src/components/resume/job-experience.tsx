import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Markdown from "markdown-to-jsx";

import { formatFromTo, toYearMonthsDuration } from "~/app/utils";
import { api } from "~/trpc/react";

dayjs.extend(duration);

interface Position {
  startDate: Date;
  endDate?: Date;
  title: string;
  location: string;
  accomplishments: string[];
}

interface JobExperienceItem {
  company: string;
  link?: string;
  positions: Position[];
}

interface AccomplishmentsProps {
  items: string[];
}

interface PositionItemProps {
  company: string;
  link?: string;
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
            <span key={index}>
              <Markdown>{trimmed}</Markdown>
            </span>
          );
        }
        return (
          <li key={index}>
            <Markdown>{trimmed}</Markdown>
          </li>
        );
      })}
    </ul>
  );
};

const PositionItem: React.FC<PositionItemProps> = ({
  company,
  link,
  position,
}) => {
  const { mutate: getReview } =
    api.coach.reviewJobAccomplishments.useMutation();

  const { startDate, endDate, title, location, accomplishments } = position;
  const { formattedFrom, formattedTo } = formatFromTo(startDate, endDate);
  const _thread_id = "1234";

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
  const { company, link, positions } = job;
  const hasMultiplePositions = positions.length > 1;

  return (
    <div className="">
      <div className="mb-2 flex items-center justify-between font-bold">
        <h2>{!link ? company : <a href={link}>{company}</a>}</h2>
      </div>
      <div
        className={`flex break-before-avoid flex-col gap-6 ${hasMultiplePositions ? "border-l-2 pl-4" : ""}`}
      >
        {positions.map((position, index) => (
          <PositionItem
            key={index}
            company={company}
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
        <JobExperienceItem key={index} job={job} />
      ))}
    </>
  );
};

export default JobExperience;
