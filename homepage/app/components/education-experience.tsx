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
    <div className="flex flex-col">
      <strong>{school}</strong>
      <a href={link}>{distinction}</a>

      <div className="pl-2">{children}</div>

      <span>{timeframe}</span>
    </div>
  );
}
