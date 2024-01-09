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
    <div className="">
      <div className="mb-2 break-inside-avoid">
        <div className="flex justify-between font-bold">
          {!link ? (
            <h3>{company}</h3>
          ) : (
            <h3>
              <a href={link}>{company}</a>
            </h3>
          )}
          <span className="text-sm">{timeframe}</span>
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
