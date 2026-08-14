"use client";

import { useMemo } from "react";
import { useController } from "react-hook-form";

import { createModal } from "~/components/modals/modal";
import {
  type ModalFormProps,
  useModalForm,
} from "~/components/modals/use-modal-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Form, useAppForm } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { formatDateInput, parseDateInput } from "~/lib/date-time";
import { addJobSchema, jobStatuses, jobStatusLabels } from "~/lib/schemas/job";
import type { RouterInputs } from "~/trpc/shared";

export type JobFormResult = RouterInputs["job"]["addJob"];

type ResumeOption = {
  id: string;
  name: string;
};

const noLinkedResumeLabel = "No linked resume";

type JobModalProps = ModalFormProps<JobFormResult> & {
  defaultValues?: Partial<JobFormResult>;
  resumes: ResumeOption[];
  submitLabel?: string;
  title?: string;
};

export const JobModal = createModal<JobFormResult, JobModalProps>(
  ({
    defaultValues,
    onSubmit,
    resumes,
    submitLabel = "Add application",
    title = "Add application",
  }) => {
    const {
      control,
      formState: { errors },
      handleSubmit,
      register,
    } = useAppForm<JobFormResult>({
      defaultValues: {
        company: "",
        location: "",
        nextActionAt: null,
        notes: "",
        resumeId: null,
        status: "SAVED",
        title: "",
        url: "",
        ...defaultValues,
      },
      schema: addJobSchema,
    });
    const nextActionAt = useController({ control, name: "nextActionAt" });
    const resumeId = useController({ control, name: "resumeId" });
    const status = useController({ control, name: "status" });
    // Base UI resolves the trigger label from `items`, not from the rendered
    // `SelectItem` children, so the map has to mirror the options below.
    const resumeItems = useMemo(
      () =>
        resumes.reduce<Record<string, string>>(
          (items, resume) => {
            items[resume.id.toString()] = resume.name;
            return items;
          },
          { none: noLinkedResumeLabel },
        ),
      [resumes],
    );
    const { dialogProps, error, isPending, submit } =
      useModalForm<JobFormResult>(onSubmit);

    const onValid = handleSubmit((values) => submit(values));

    return (
      <Dialog {...dialogProps}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Keep the posting, next step, and tailored resume together.
            </DialogDescription>
          </DialogHeader>

          <Form noValidate onSubmit={onValid}>
            <div className="grid gap-4 sm:grid-cols-2">
              <JobTextField
                error={errors.company?.message}
                id="job-company"
                label="Company"
              >
                <Input
                  id="job-company"
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.company)}
                  {...register("company")}
                />
              </JobTextField>

              <JobTextField
                error={errors.title?.message}
                id="job-title"
                label="Position"
              >
                <Input
                  id="job-title"
                  autoComplete="organization-title"
                  aria-invalid={Boolean(errors.title)}
                  {...register("title")}
                />
              </JobTextField>
            </div>

            <JobTextField
              error={errors.url?.message}
              id="job-url"
              label="Job posting URL"
            >
              <Input
                id="job-url"
                type="url"
                inputMode="url"
                placeholder="https://company.com/jobs/..."
                aria-invalid={Boolean(errors.url)}
                {...register("url")}
              />
            </JobTextField>

            <div className="grid gap-4 sm:grid-cols-2">
              <JobTextField
                error={errors.location?.message}
                id="job-location"
                label="Location"
              >
                <Input
                  id="job-location"
                  placeholder="Remote, Seattle, WA"
                  aria-invalid={Boolean(errors.location)}
                  {...register("location")}
                />
              </JobTextField>

              <JobTextField id="job-status" label="Status">
                <Select
                  items={jobStatusLabels}
                  value={status.field.value}
                  onValueChange={(value) => status.field.onChange(value)}
                >
                  <SelectTrigger id="job-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobStatuses.map((value) => (
                      <SelectItem key={value} value={value}>
                        {jobStatusLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </JobTextField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <JobTextField id="job-next-action" label="Next action date">
                <Input
                  id="job-next-action"
                  type="date"
                  value={formatDateInput(nextActionAt.field.value)}
                  onBlur={nextActionAt.field.onBlur}
                  onChange={(event) =>
                    nextActionAt.field.onChange(
                      parseDateInput(event.target.value),
                    )
                  }
                />
              </JobTextField>

              <JobTextField id="job-resume" label="Linked resume">
                <Select
                  items={resumeItems}
                  value={resumeId.field.value?.toString() ?? "none"}
                  onValueChange={(value) =>
                    resumeId.field.onChange(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger id="job-resume" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{noLinkedResumeLabel}</SelectItem>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id.toString()}>
                        {resume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </JobTextField>
            </div>

            <JobTextField
              error={errors.notes?.message}
              id="job-notes"
              label="Notes"
            >
              <Textarea
                id="job-notes"
                rows={4}
                placeholder="Contacts, interview context, questions, or follow-up details"
                aria-invalid={Boolean(errors.notes)}
                {...register("notes")}
              />
            </JobTextField>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : submitLabel}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    );
  },
);

function JobTextField({
  children,
  error,
  id,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
