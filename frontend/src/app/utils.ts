import dayjs from "dayjs";

function toYearMonthsDuration(from: Date, to?: Date) {
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
}

function formatFromTo(from: Date, to?: Date, yearOnly: boolean = false) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: yearOnly ? undefined : "short",
      year: "numeric",
    });

  const formattedFrom = formatDate(from);
  const formattedTo = to ? formatDate(to) : "Present";

  return { formattedFrom, formattedTo };
}

export { formatFromTo, toYearMonthsDuration };
