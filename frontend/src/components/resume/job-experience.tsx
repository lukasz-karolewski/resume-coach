import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { ReactNode } from "react";

dayjs.extend(duration);

function JobExperience({
  company,
  link,
  from,
  to,
  title,
  location,
  children,
}: {
  company: string;
  link?: string;
  from: Date;
  to?: Date;
  title: string;
  location: string;
  children: ReactNode;
}) {
  const formattedFrom = from.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  });
  const formattedTo = to
    ? to.toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        year: "numeric",
      })
    : "Present";

  const toYearMonthsDuration = (from: Date, to?: Date) => {
    const fromDate = dayjs(from);
    const toDate = to ? dayjs(to) : dayjs();

    const totalMonths = toDate.diff(fromDate, "month", true);
    const roundedMonths = Math.round(totalMonths);

    const years = Math.floor(roundedMonths / 12);
    const remainingMonths = roundedMonths % 12;

    if (years === 0) {
      return `${remainingMonths} m`;
    }

    if (remainingMonths === 0) {
      return `${years} y`;
    }

    return `${years} y, ${remainingMonths} m`;
  };

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
      {children}
    </div>
  );
}

JobExperience.Accomplishments = function Accomplishments({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ul className="ml-6 list-disc break-before-avoid text-sm">{children}</ul>
  );
};

export default JobExperience;
