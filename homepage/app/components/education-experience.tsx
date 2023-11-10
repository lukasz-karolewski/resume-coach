export default function EducationExperience({
  distinction,
  school,
  location,
  link,
  timeframe,
}: {
  distinction: string;
  school: string;
  link: string;
  location: string;
  timeframe: string;
}) {
  return (
    <p>
      <strong>{school}</strong>
      <br />
      <a href={link}>{distinction}</a>
      <br />
      {timeframe}
    </p>
  );
}
