import { ReactNode } from "react";

export default function EducationExperience({
  distinction,
  school,
  location,
  link,
  timeframe,
  children,
}: {
  distinction: string;
  school: string;
  link: string;
  location: string;
  timeframe: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex break-inside-avoid flex-col text-sm">
      <div className="flex justify-between">
        <strong>{school}</strong>
        <span>{timeframe}</span>
      </div>
      <a href={link}>{distinction}</a>

      {!!children && <div className="pl-2">{children}</div>}
    </div>
  );
}
