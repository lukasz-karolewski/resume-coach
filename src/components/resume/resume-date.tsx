"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  formatRelativeTime,
  formatTimestampTooltip,
  toDateTimeValue,
} from "~/lib/date-time";

type ResumeDateProps = {
  label: string;
  value: Date | string;
};

export default function ResumeDate({ label, value }: ResumeDateProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <time
            dateTime={toDateTimeValue(value)}
            className="cursor-default underline decoration-dotted underline-offset-2"
          >
            {label} {formatRelativeTime(value)}
          </time>
        </TooltipTrigger>
        <TooltipContent>{formatTimestampTooltip(value)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
