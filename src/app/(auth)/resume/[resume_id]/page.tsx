"use client";

import {
  CheckIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import ContactInfo from "~/components/resume/contact-info";
import EducationExperience from "~/components/resume/education-experience";
import JobExperience from "~/components/resume/job-experience";
import { ProfessionalSummary } from "~/components/resume/professional-summary";
import Section from "~/components/resume/section";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { EducationType } from "~/generated/prisma/enums";
import { api } from "~/trpc/react";

export default function ResumePage(props: {
  params: Promise<{ resume_id: string }> | { resume_id: string };
}) {
  const params = "then" in props.params ? use(props.params) : props.params;
  const router = useRouter();
  const [draftName, setDraftName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  // Try to parse as number (for database resumes with numeric IDs)
  const numericId = Number.parseInt(params.resume_id, 10);
  const isNumericId = !Number.isNaN(numericId);
  const utils = api.useUtils();

  // Use getById for numeric IDs, getResume for string names
  const { data: resume } = api.resume.getById.useQuery(
    { id: numericId },
    { enabled: isNumericId },
  );
  const updateMutation = api.resume.update.useMutation({
    onSuccess: async () => {
      setIsEditingName(false);
      await utils.resume.getById.invalidate({ id: numericId });
      await utils.resume.list.invalidate();
    },
  });
  const duplicateMutation = api.resume.duplicate.useMutation({
    onSuccess: async (nextResume) => {
      await utils.resume.list.invalidate();
      router.push(`/resume/${nextResume.id}`);
    },
  });
  const deleteMutation = api.resume.delete.useMutation({
    onSuccess: async () => {
      await utils.resume.list.invalidate();
      router.push("/resume");
    },
  });

  useEffect(() => {
    if (resume) {
      setDraftName(resume.name);
    }
  }, [resume]);

  if (!resume) {
    return <div>Loading...</div>;
  }

  const education = resume.education.filter(
    (e) => e.type === EducationType.EDUCATION,
  );
  const certificates = resume.education.filter(
    (e) => e.type === EducationType.CERTIFICATION,
  );
  const hasPendingNameChange =
    draftName.trim().length > 0 &&
    draftName.trim() !== resume.name &&
    !updateMutation.isPending;

  const saveName = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === resume.name) {
      setDraftName(resume.name);
      setIsEditingName(false);
      return;
    }

    updateMutation.mutate({
      id: resume.id,
      name: trimmed,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TooltipProvider delayDuration={150}>
        <div className="sticky top-[89px] z-20 mx-auto w-full max-w-[calc(8.5in+6rem)] print:hidden">
          <div className="rounded-2xl border bg-card/95 px-12 py-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isEditingName ? (
                  <Input
                    aria-label="Resume name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveName();
                      }
                      if (e.key === "Escape") {
                        setDraftName(resume.name);
                        setIsEditingName(false);
                      }
                    }}
                    className="h-10 max-w-2xl border-border/80 bg-background text-base font-semibold shadow-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <h1 className="truncate text-xl font-semibold tracking-tight">
                      {resume.name}
                    </h1>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="cursor-pointer"
                          aria-label="Edit resume name"
                          onClick={() => setIsEditingName(true)}
                        >
                          <PencilSquareIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit name</TooltipContent>
                    </Tooltip>
                  </>
                )}
                {isEditingName ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="cursor-pointer"
                          aria-label="Save resume name"
                          disabled={!hasPendingNameChange}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={saveName}
                        >
                          <CheckIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save name</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="cursor-pointer"
                          aria-label="Cancel resume name edit"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setDraftName(resume.name);
                            setIsEditingName(false);
                          }}
                        >
                          <XMarkIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cancel</TooltipContent>
                    </Tooltip>
                  </>
                ) : null}
              </div>
              <div className="flex items-center gap-1 self-end md:self-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="cursor-pointer"
                      aria-label="Duplicate resume"
                      disabled={duplicateMutation.isPending}
                      onClick={() =>
                        duplicateMutation.mutate({
                          id: resume.id,
                          name: `${resume.name} (Copy)`,
                        })
                      }
                    >
                      <Squares2X2Icon className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="cursor-pointer"
                          aria-label="Delete resume"
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete resume?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{resume.name}" and its
                        associated resume data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteMutation.mutate({ id: resume.id });
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      <div className="p-12 bg-white shadow-lg print:shadow-none print:p-0 mx-auto">
        <div className="flex w-full max-w-[8.5in] flex-col gap-8">
          <ContactInfo contactInfo={resume.contactInfo} />

          <Section title="Summary">
            <ProfessionalSummary info={resume.summary} />
          </Section>

          <Section title="Experience">
            <JobExperience jobs={resume.experience} />
          </Section>

          <Section title="Education" layout="compact">
            <EducationExperience educationList={education} />
          </Section>

          <Section title="Certificates" layout="compact">
            <EducationExperience educationList={certificates} />
          </Section>
        </div>
      </div>
    </div>
  );
}
