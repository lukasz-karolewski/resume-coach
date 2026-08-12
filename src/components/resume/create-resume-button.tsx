"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { jobListQuery } from "~/components/jobs/job-queries";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useTRPC } from "~/trpc/react";

import { accomplishmentProfileForResumeQuery } from "./resume-queries";

type CreateResumeButtonProps = {
  buttonLabel?: string;
  buttonProps?: React.ComponentProps<typeof Button>;
};

type JobOption = {
  company?: string | null;
  id: string;
  title?: string | null;
  url: string;
};

const noLinkedJobLabel = "None - Base Resume";

function jobLabel(job: JobOption) {
  return job.title || job.company || job.url;
}

export default function CreateResumeButton({
  buttonLabel = "Create new resume",
  buttonProps,
}: CreateResumeButtonProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const { data: jobs } = useSuspenseQuery(jobListQuery(trpc));
  const { data: accomplishmentProfile } = useSuspenseQuery(
    accomplishmentProfileForResumeQuery(trpc),
  );

  const createMutation = useMutation(
    trpc.resume.create.mutationOptions({
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setNewResumeName("");
        setSelectedJobId(undefined);
      },
    }),
  );
  const createTailoredMutation = useMutation(
    trpc.resume.createTailoredFromProfile.mutationOptions({
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setNewResumeName("");
        setSelectedJobId(undefined);
      },
    }),
  );

  const handleCreateResume = () => {
    createMutation.mutate({
      education: [],
      experience: [],
      jobId: selectedJobId,
      name: newResumeName || "New Resume",
      professionalSummary: "",
    });
  };

  const handleGenerateFromProfile = () => {
    if (!selectedJobId) {
      return;
    }

    createTailoredMutation.mutate({
      jobId: selectedJobId,
      name: newResumeName || undefined,
    });
  };

  const canGenerateFromProfile =
    Boolean(selectedJobId) && (accomplishmentProfile?.roles.length ?? 0) > 0;

  // Base UI resolves the trigger label from `items`, not from the rendered
  // `SelectItem` children, so the map has to mirror the options below.
  const jobItems = useMemo(
    () =>
      (jobs ?? []).reduce<Record<string, string>>(
        (items, job) => {
          items[job.id] = jobLabel(job);
          return items;
        },
        { none: noLinkedJobLabel },
      ),
    [jobs],
  );

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogTrigger render={<Button {...buttonProps} />}>
        {buttonLabel}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Resume</DialogTitle>
          <DialogDescription>
            Start from a blank resume, or generate one tailored to a job you are
            tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="resume-name">Resume Name</Label>
            <Input
              id="resume-name"
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              placeholder="e.g., Software Engineer Resume"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="resume-job">Link to Job (Optional)</Label>
            <Select
              items={jobItems}
              value={selectedJobId ?? "none"}
              onValueChange={(value) =>
                setSelectedJobId(
                  !value || value === "none" ? undefined : String(value),
                )
              }
            >
              <SelectTrigger id="resume-job" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{noLinkedJobLabel}</SelectItem>
                {jobs?.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {jobLabel(job)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          {canGenerateFromProfile ? (
            <Button
              variant="secondary"
              onClick={handleGenerateFromProfile}
              disabled={createTailoredMutation.isPending}
            >
              {createTailoredMutation.isPending
                ? "Generating..."
                : "Generate from profile"}
            </Button>
          ) : null}
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleCreateResume}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Resume"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
