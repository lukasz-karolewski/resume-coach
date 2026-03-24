"use client";

import {
  CheckIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

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

const TITLE_AUTOSAVE_DELAY_MS = 800;
const SAVED_INDICATOR_DURATION_MS = 2000;

export default function ResumePage(props: {
  params: Promise<{ resume_id: string }> | { resume_id: string };
}) {
  const params = "then" in props.params ? use(props.params) : props.params;
  const router = useRouter();
  const [draftName, setDraftName] = useState("");
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const lastSyncedNameRef = useRef("");
  const pendingSaveNameRef = useRef<string | null>(null);
  const lastResumeIdRef = useRef<number | null>(null);
  const savedIndicatorTimeoutRef = useRef<number | null>(null);

  // Try to parse as number (for database resumes with numeric IDs)
  const numericId = Number.parseInt(params.resume_id, 10);
  const isNumericId = !Number.isNaN(numericId);
  const utils = api.useUtils();

  // Use getById for numeric IDs, getResume for string names
  const { data: resume } = api.resume.getById.useQuery(
    { id: numericId },
    { enabled: isNumericId },
  );
  const updateTitleMutation = api.resume.updateTitle.useMutation({
    onError: () => {
      pendingSaveNameRef.current = null;
      setShowSavedIndicator(false);
    },
    onSuccess: async (updatedResume) => {
      lastSyncedNameRef.current = updatedResume.name;
      pendingSaveNameRef.current = null;
      setDraftName((currentDraft) =>
        currentDraft.trim() === updatedResume.name
          ? updatedResume.name
          : currentDraft,
      );
      setShowSavedIndicator(true);

      if (savedIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(savedIndicatorTimeoutRef.current);
      }

      savedIndicatorTimeoutRef.current = window.setTimeout(() => {
        setShowSavedIndicator(false);
      }, SAVED_INDICATOR_DURATION_MS);

      utils.resume.getById.setData({ id: numericId }, (currentResume) =>
        currentResume
          ? { ...currentResume, name: updatedResume.name }
          : currentResume,
      );
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
    if (!resume) {
      return;
    }

    const shouldAdoptServerName =
      lastResumeIdRef.current !== resume.id ||
      draftName === "" ||
      draftName.trim() === lastSyncedNameRef.current;

    lastResumeIdRef.current = resume.id;
    lastSyncedNameRef.current = resume.name;

    if (shouldAdoptServerName) {
      setDraftName(resume.name);
    }
  }, [draftName, resume]);

  useEffect(() => {
    if (!resume) {
      return;
    }

    const trimmedName = draftName.trim();

    if (!trimmedName) {
      return;
    }

    if (
      trimmedName === lastSyncedNameRef.current ||
      trimmedName === pendingSaveNameRef.current
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pendingSaveNameRef.current = trimmedName;
      setShowSavedIndicator(false);
      updateTitleMutation.mutate({
        id: resume.id,
        name: trimmedName,
      });
    }, TITLE_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftName, resume, updateTitleMutation]);

  useEffect(() => {
    return () => {
      if (savedIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  if (!resume) {
    return <div>Loading...</div>;
  }

  const education = resume.education.filter(
    (e) => e.type === EducationType.EDUCATION,
  );
  const certificates = resume.education.filter(
    (e) => e.type === EducationType.CERTIFICATION,
  );
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TooltipProvider delayDuration={150}>
        <div className="sticky top-[89px] z-20 mx-auto w-full max-w-[calc(8.5in+6rem)] print:hidden">
          <div className="rounded-2xl border bg-card/95 px-12 py-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Input
                  aria-label="Resume name"
                  value={draftName}
                  onBlur={() => {
                    if (!draftName.trim()) {
                      setDraftName(lastSyncedNameRef.current);
                    }
                  }}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="h-11 w-auto max-w-2xl rounded-none border-0 border-b border-border/50 bg-transparent px-0 pb-px pt-0 text-xl font-semibold tracking-tight shadow-none [field-sizing:content] focus:border-b focus:border-foreground/30 focus:outline-hidden focus-visible:ring-0"
                />
                <div
                  aria-label={showSavedIndicator ? "Saved" : undefined}
                  aria-live="polite"
                  className={`pointer-events-none flex size-5 items-center justify-center text-emerald-600 transition-all duration-200 ${
                    showSavedIndicator
                      ? "scale-100 opacity-100"
                      : "scale-95 opacity-0"
                  }`}
                >
                  <CheckIcon className="size-4" />
                </div>
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
