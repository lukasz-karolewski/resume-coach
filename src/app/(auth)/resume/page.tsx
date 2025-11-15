"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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

  const deleteMutation = api.resume.delete.useMutation({
    onSuccess: () => {
      void utils.resume.list.invalidate();
    },
  });

  const duplicateMutation = api.resume.duplicate.useMutation({
    onSuccess: () => {
      void utils.resume.list.invalidate();
    },
  });

  const handleCreateResume = () => {
    createMutation.mutate({
      education: [],
      experience: [],
      jobId: selectedJobId,
      name: newResumeName || "New Resume",
      professionalSummary: [],
    });
  };

  const handleDuplicate = (id: number, name: string) => {
    const newName = prompt(
      `Enter name for duplicated resume:`,
      `${name} (Copy)`,
    );
    if (newName) {
      duplicateMutation.mutate({ id, name: newName });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="m-auto flex max-w-4xl flex-col gap-4 bg-white p-12 shadow-lg dark:bg-gray-800">
        <p>Loading resumes...</p>
      </div>
    );
  }

  return (
    <div className="m-auto flex max-w-6xl flex-col gap-6 bg-white p-12 shadow-lg dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Resumes</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Create New Resume
        </Button>
      </div>

      {resumes && resumes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center">
          <p className="mb-4 text-gray-600">
            No resumes yet. Create your first resume to get started!
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create Your First Resume
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes?.map((resume) => {
            const isTemplate = resume.id < 0; // Template resumes have negative IDs
            return (
              <div
                key={resume.id}
                className="flex flex-col rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md"
              >
                <div className="mb-3 flex-1">
                  <h3 className="mb-2 text-lg font-semibold">{resume.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {resume.Job && (
                      <p className="truncate">
                        <span className="font-medium">Job:</span>{" "}
                        {resume.Job.title ||
                          resume.Job.company ||
                          "Untitled Job"}
                      </p>
                    )}
                    {resume.contactInfo && (
                      <p className="truncate">
                        <span className="font-medium">Contact:</span>{" "}
                        {resume.contactInfo.email}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Experience:</span>{" "}
                      {resume._count.experience} companies
                    </p>
                    <p>
                      <span className="font-medium">Education:</span>{" "}
                      {resume._count.education} entries
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href={`/resume/${resume.id}`}>
                    <Button className="w-full" variant="default">
                      View & Edit
                    </Button>
                  </Link>
                  {!isTemplate && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => handleDuplicate(resume.id, resume.name)}
                        disabled={duplicateMutation.isPending}
                      >
                        Duplicate
                      </Button>
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={() => handleDelete(resume.id, resume.name)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
          <div>
            <label className="mb-2 block text-sm font-medium">
              Resume Name
            </label>
            <Input
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              placeholder="e.g., Software Engineer Resume"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Link to Job (Optional)
            </label>
            <select
              value={selectedJobId || ""}
              onChange={(e) => setSelectedJobId(e.target.value || undefined)}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 text-gray-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/50"
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
