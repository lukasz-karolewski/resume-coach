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

function formatMonthInput(value?: Date | null) {
  if (!value) {
    return "";
  }

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Date-only values are stored at UTC midnight; read them back the same way. */
function formatDateInput(value?: Date | null) {
  if (!value) {
    return "";
  }

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Counterpart to `formatDateInput` for a `<input type="date">` value. */
function parseDateInput(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export {
  formatDateInput,
  formatMonthInput,
  formatRelativeTime,
  formatTimestampTooltip,
  parseDateInput,
  toDateTimeValue,
};
