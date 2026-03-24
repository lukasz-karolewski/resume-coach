"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Modal from "~/components/ui/modal";
import { api } from "~/trpc/react";

type CreateResumeButtonProps = {
  buttonLabel?: string;
  buttonProps?: React.ComponentProps<typeof Button>;
};

export default function CreateResumeButton({
  buttonLabel = "Create new resume",
  buttonProps,
}: CreateResumeButtonProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const { data: jobs } = api.job.getJobs.useQuery();

  const createMutation = api.resume.create.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewResumeName("");
      setSelectedJobId(undefined);
      router.refresh();
    },
  });

  const handleCreateResume = () => {
    createMutation.mutate({
      education: [],
      experience: [],
      jobId: selectedJobId,
      name: newResumeName || "New Resume",
      professionalSummary: "",
    });
  };

  return (
    <>
      <Button onClick={() => setIsCreateModalOpen(true)} {...buttonProps}>
        {buttonLabel}
      </Button>

      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Resume"
        className="max-w-lg"
      >
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="resume-name">Resume Name</Label>
            <Input
              id="resume-name"
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              placeholder="e.g., Software Engineer Resume"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-job">Link to Job (Optional)</Label>
            <select
              id="resume-job"
              value={selectedJobId || ""}
              onChange={(e) => setSelectedJobId(e.target.value || undefined)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">None - Base Resume</option>
              {jobs?.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title || job.company || job.url}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateResume}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Resume"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
