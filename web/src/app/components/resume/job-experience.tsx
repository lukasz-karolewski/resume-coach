import { ReactNode } from "react";

function JobExperience({
  company,
  link,
  timeframe,
  title,
  location,
  children,
}: {
  company: string;
  link?: string;
  timeframe: string;
  title: string;
  location: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2">
        <div className="flex justify-between font-bold">
          {!link ? (
            <h3>{company}</h3>
          ) : (
            <h3>
              <a href={link}>{company}</a>
            </h3>
          )}
          <span>{timeframe}</span>
        </div>
        <div className="flex justify-between italic text-sm">
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
  return <ul className="list-disc text-sm">{children}</ul>;
};

export default JobExperience;
