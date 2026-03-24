"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Modal from "~/components/ui/modal";
import { api } from "~/trpc/react";

export default function ResumePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const utils = api.useUtils();
  const { data: resumes, isLoading } = api.resume.list.useQuery();
  const { data: jobs } = api.job.getJobs.useQuery();

  const createMutation = api.resume.create.useMutation({
    onSuccess: () => {
      void utils.resume.list.invalidate();
      setIsCreateModalOpen(false);
      setNewResumeName("");
      setSelectedJobId(undefined);
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

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border bg-card p-10 shadow-sm">
        <p>Loading resumes...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">My Resumes</h1>
          <p className="text-sm text-muted-foreground">
            Keep a focused set of resume variants and open the one you want to
            refine.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create new resume
        </Button>
      </div>

      {resumes && resumes.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>No resumes yet</CardTitle>
            <CardDescription>
              Create your first resume to start building tailored versions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create your first resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resumes?.map((resume) => {
            const linkedJob = resume.Job?.title || resume.Job?.company;

            return (
              <Card
                key={resume.id}
                className="group border-border/70 bg-card/95 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="space-y-4">
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-2 text-xl">
                      <Link
                        href={`/resume/${resume.id}`}
                        className="transition-colors hover:text-primary"
                      >
                        {resume.name}
                      </Link>
                    </CardTitle>
                    {linkedJob ? (
                      <CardDescription className="line-clamp-1">
                        {linkedJob}
                      </CardDescription>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Experience
                      </p>
                      <p className="mt-1 font-medium">
                        {resume._count.experience} roles
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Education
                      </p>
                      <p className="mt-1 font-medium">
                        {resume._count.education} entries
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-xs text-muted-foreground/80">
                    <p>
                      Created {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
