import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function toDateTimeValue(value: Date | string) {
  return new Date(value).toISOString();
}

function formatRelativeTime(value: Date | string) {
  return dayjs(value).fromNow();
}

function formatTimestampTooltip(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export { formatRelativeTime, formatTimestampTooltip, toDateTimeValue };
