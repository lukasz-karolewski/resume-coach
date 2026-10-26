"use client";

import {
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import type { z } from "zod";
import { showModal } from "~/components/modals/modal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  jobStatuses,
  jobStatusLabels,
  type jobStatusSchema,
} from "~/lib/schemas/job";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/shared";

import { type JobFormResult, JobModal } from "./job-modal";
import { jobListQuery, resumesForJobQuery } from "./job-queries";

type Job = RouterOutputs["job"]["getJobs"][number];
type JobStatus = z.infer<typeof jobStatusSchema>;
type StatusFilter = "ALL" | JobStatus;

const terminalStatuses = new Set<JobStatus>(["OFFER", "REJECTED", "WITHDRAWN"]);

const allStatusesLabel = "All statuses";
const statusFilterItems: Record<StatusFilter, string> = {
  ALL: allStatusesLabel,
  ...jobStatusLabels,
};

// Pinned to UTC so the server-rendered table and the hydrated client agree.
// `nextActionAt` is normalized to UTC midnight on write, so it renders the day
// that was picked; `createdAt` is a real instant and therefore shows its UTC day.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export function JobPageClient() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: jobs } = useSuspenseQuery(jobListQuery(trpc));
  const { data: resumes } = useSuspenseQuery(resumesForJobQuery(trpc));
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isFiltering, startFiltering] = useTransition();

  const invalidateTracker = async () => {
    await Promise.all([
      queryClient.invalidateQueries(trpc.job.pathFilter()),
      queryClient.invalidateQueries(trpc.resume.pathFilter()),
    ]);
  };

  const addJob = useMutation(
    trpc.job.addJob.mutationOptions({ onSettled: invalidateTracker }),
  );
  const editJob = useMutation(
    trpc.job.updateJob.mutationOptions({ onSettled: invalidateTracker }),
  );
  const changeStatus = useMutation(
    trpc.job.updateJobStatus.mutationOptions({ onSettled: invalidateTracker }),
  );

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (statusFilter !== "ALL" && job.status !== statusFilter) return false;
        if (!deferredQuery) return true;

        return [job.company, job.title, job.location, job.notes].some((value) =>
          value?.toLowerCase().includes(deferredQuery),
        );
      }),
    [deferredQuery, jobs, statusFilter],
  );

  const activeCount = jobs.filter(
    (job) => !terminalStatuses.has(job.status),
  ).length;
  const interviewCount = jobs.filter(
    (job) => job.status === "INTERVIEW",
  ).length;
  const offerCount = jobs.filter((job) => job.status === "OFFER").length;

  async function openCreateJob() {
    try {
      await showModal(JobModal, {
        onSubmit: (values) => addJob.mutateAsync(values),
        resumes,
      });
    } catch {
      // Dismissing a modal intentionally rejects its promise.
    }
  }

  async function openEditJob(job: Job) {
    try {
      await showModal(JobModal, {
        defaultValues: jobDefaults(job),
        onSubmit: (values) => editJob.mutateAsync({ id: job.id, ...values }),
        resumes,
        submitLabel: "Save changes",
        title: "Edit application",
      });
    } catch {
      // Dismissing a modal intentionally rejects its promise.
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Job tracker</h1>
          <p className="text-sm text-muted-foreground">
            Coordinate applications, follow-ups, and tailored resumes in one
            place.
          </p>
        </div>
        <Button onClick={openCreateJob}>
          <PlusIcon data-icon="inline-start" />
          Add application
        </Button>
      </header>

      <section
        aria-label="Pipeline summary"
        className="grid grid-cols-3 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
      >
        <Metric label="Active applications" value={activeCount} />
        <Metric label="Interviewing" value={interviewCount} />
        <Metric label="Offers" value={offerCount} />
      </section>

      <section aria-labelledby="applications-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="applications-heading" className="font-medium">
              Applications
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} of {jobs.length} shown
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search applications"
                className="pl-9"
                placeholder="Search company, role, notes"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select
              items={statusFilterItems}
              value={statusFilter}
              onValueChange={(value) =>
                startFiltering(() => setStatusFilter(value as StatusFilter))
              }
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="w-full sm:w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{allStatusesLabel}</SelectItem>
                {jobStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {jobStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-opacity data-[filtering=true]:opacity-70"
          data-filtering={isFiltering}
        >
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="grid size-11 place-items-center rounded-full bg-muted">
                <PlusIcon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">No applications yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the first role you want to track.
                </p>
              </div>
              <Button variant="outline" onClick={openCreateJob}>
                Add application
              </Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              No applications match these filters.
            </div>
          ) : (
            <Table className="max-md:block">
              <TableHeader className="max-md:hidden">
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Next action</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="max-md:block">
                {filteredJobs.map((job) => (
                  <TableRow key={job.id} className={stackedRow}>
                    <TableCell className={stackedCell}>
                      <div className="font-medium">
                        {job.company ?? "Company not added"}
                      </div>
                      {job.location ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {job.location}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className={stackedCell}>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-56 items-center gap-1.5 font-medium text-foreground hover:text-primary max-md:max-w-full"
                      >
                        <span className="truncate">
                          {job.title ?? "Position not added"}
                        </span>
                        <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell className={cn(stackedCell, "max-md:pt-2")}>
                      <StatusSelect
                        disabled={
                          changeStatus.isPending &&
                          changeStatus.variables?.id === job.id
                        }
                        job={job}
                        onChange={(status) =>
                          changeStatus.mutate({ id: job.id, status })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-md:hidden">
                      {formatJobDate(job.createdAt)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        stackedCell,
                        stackedLabel,
                        "max-md:before:content-['Next_action:_']",
                        !job.nextActionAt && "max-md:hidden",
                      )}
                    >
                      {job.nextActionAt ? (
                        formatJobDate(job.nextActionAt)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        stackedCell,
                        stackedLabel,
                        "max-md:before:content-['Resume:_']",
                        !job.resume[0] && "max-md:hidden",
                      )}
                    >
                      {job.resume[0] ? (
                        <Link
                          href={`/resume/${job.resume[0].id}`}
                          className="font-medium hover:text-primary"
                        >
                          {job.resume[0].name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        stackedCell,
                        "whitespace-normal",
                        !job.notes && "max-md:hidden",
                      )}
                    >
                      {job.notes ? (
                        <p
                          className="line-clamp-2 min-w-40 [overflow-wrap:anywhere] text-muted-foreground"
                          title={job.notes}
                        >
                          {job.notes}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right max-md:col-start-2 max-md:row-start-1 max-md:p-0">
                      <Button
                        aria-label={`Edit ${job.title ?? "application"} at ${job.company ?? "unknown company"}`}
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEditJob(job)}
                      >
                        <PencilSquareIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}

// Below `md` each table row collapses into a two-column card: the details
// stack in the first column and the edit action pins to the top-right. Cells
// that would only show a placeholder dash are hidden there (as is the "Added"
// date, to keep cards short), and the ones that lose their column header get
// an inline label via `before:content`.
const stackedRow =
  "max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-start max-md:gap-x-3 max-md:px-4 max-md:py-3";
const stackedLabel = "max-md:before:text-muted-foreground";
const stackedCell =
  "max-md:col-start-1 max-md:px-0 max-md:py-0.5 max-md:whitespace-normal";

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r p-3 last:border-r-0 sm:px-5 sm:py-4">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusSelect({
  disabled,
  job,
  onChange,
}: {
  disabled: boolean;
  job: Job;
  onChange: (status: JobStatus) => void;
}) {
  return (
    <Select
      disabled={disabled}
      value={job.status}
      onValueChange={(value) => onChange(value as JobStatus)}
    >
      <SelectTrigger
        aria-label={`Status for ${job.title ?? "application"} at ${job.company ?? "unknown company"}`}
        className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
      >
        <Badge variant="outline">{jobStatusLabels[job.status]}</Badge>
      </SelectTrigger>
      <SelectContent>
        {jobStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {jobStatusLabels[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function jobDefaults(job: Job): JobFormResult {
  return {
    company: job.company ?? "",
    location: job.location ?? "",
    nextActionAt: job.nextActionAt,
    notes: job.notes ?? "",
    resumeId: job.resume[0]?.id ?? null,
    status: job.status,
    title: job.title ?? "",
    url: job.url,
  };
}

export function formatJobDate(value: Date) {
  return dateFormatter.format(value);
}
