import {
  formatRelativeTime,
  formatTimestampTooltip,
  toDateTimeValue,
} from "~/lib/date-time";

/** A machine-readable `<time>` showing "3 days ago", with the full timestamp on hover. */
export function RelativeTime({ value }: { value: Date | string }) {
  return (
    <time
      dateTime={toDateTimeValue(value)}
      title={formatTimestampTooltip(value)}
    >
      {formatRelativeTime(value)}
    </time>
  );
}
