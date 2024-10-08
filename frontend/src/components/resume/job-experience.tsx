import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import { formatFromTo, toYearMonthsDuration } from "~/app/utils";

dayjs.extend(duration);

interface AccomplishmentsProps {
  items: string[];
}

interface JobExperienceItem {
  company: string;
  link?: string;
  from: Date;
  to?: Date;
  title: string;
  location: string;
  accomplishments: string[];
}

interface JobExperienceItemProps {
  job: JobExperienceItem;
}

interface JobExperienceProps {
  jobs: JobExperienceItem[];
}

const Accomplishments: React.FC<AccomplishmentsProps> = ({ items }) => {
  return (
    <ul className="ml-6 list-disc break-before-avoid text-sm">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

const JobExperienceItem: React.FC<JobExperienceItemProps> = ({ job }) => {
  const { company, link, from, to, title, location, accomplishments } = job;
  const { formattedFrom, formattedTo } = formatFromTo(from, to);

  return (
    <div>
      <div className="mb-2 break-inside-avoid">
        <div className="flex items-center justify-between font-bold">
          {!link ? (
            <h3>{company}</h3>
          ) : (
            <h3>
              <a href={link}>{company}</a>
            </h3>
          )}
          <span className="text-sm">
            {toYearMonthsDuration(from, to)} &bull; {formattedFrom} -{" "}
            {formattedTo}
          </span>
        </div>
        <div className="flex justify-between text-sm italic">
          <span>{title}</span>
          <span>{location}</span>
        </div>
      </div>
      <Accomplishments items={accomplishments} />
    </div>
  );
};

const JobExperience: React.FC<JobExperienceProps> = ({ jobs }) => {
  return (
    <div>
      {jobs.map((job, index) => (
        <JobExperienceItem key={index} job={job} />
      ))}
    </div>
  );
};

export default JobExperience;
