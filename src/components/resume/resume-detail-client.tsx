"use client";

import {
  CheckIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  PlusIcon,
  PrinterIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddResumeSectionDropdown } from "~/components/resume/add-resume-section-dropdown";
import ContactInfo from "~/components/resume/contact-info";
import EducationExperience from "~/components/resume/education-experience";
import JobExperience from "~/components/resume/job-experience";
import { MarkdownEditorDialog } from "~/components/resume/markdown-editor-dialog";
import { PatentList } from "~/components/resume/patent-list";
import { ProfessionalSummary } from "~/components/resume/professional-summary";
import { ResumeSectionItemDialog } from "~/components/resume/resume-section-item-dialog";
import Section from "~/components/resume/section";
import { Skill } from "~/components/resume/skill";
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
import { toast } from "~/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  type ResumeSectionType,
  resumeSectionOptions,
} from "~/lib/resume-sections";
import type { ResumeSectionItem } from "~/lib/schemas/resume-section-item";
import { useTRPC } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/shared";
import { partitionResumeEducation } from "./resume-content";
import { resumeDetailQuery } from "./resume-queries";

const TITLE_AUTOSAVE_DELAY_MS = 800;
const SAVED_INDICATOR_DURATION_MS = 2000;

type Resume = RouterOutputs["resume"]["getById"];

type EditableSectionItem = {
  id: number;
  item: ResumeSectionItem;
};

function toMonthInput(date: Date) {
  return date.toISOString().slice(0, 7);
}

function getResumeSkillNames(resume: Resume) {
  const names = new Set<string>();

  for (const resumeSkill of resume.skills) {
    names.add(resumeSkill.skill.name);
  }

  for (const experience of resume.experience) {
    for (const position of experience.positions) {
      for (const positionSkill of position.skillPosition) {
        names.add(positionSkill.skill.name);
      }
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

function getActiveSectionTypes(
  resume: Resume,
  educationCount: number,
  certificateCount: number,
  skillCount: number,
) {
  const activeTypes = new Set<ResumeSectionType>(
    resume.sections.map((section) => section.type),
  );

  if (resume.experience.length > 0) activeTypes.add("EXPERIENCE");
  if (educationCount > 0) activeTypes.add("EDUCATION");
  if (certificateCount > 0) activeTypes.add("CERTIFICATION");
  if (skillCount > 0) activeTypes.add("SKILLS_SUMMARY");
  if (resume.patents.length > 0) activeTypes.add("PATENTS");

  return activeTypes;
}

function SectionAddButton({
  itemLabel,
  onClick,
}: {
  itemLabel: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={`Add ${itemLabel}`}
      className="print:hidden"
      size="xs"
      type="button"
      variant="ghost"
      onClick={onClick}
    >
      <PlusIcon data-icon="inline-start" />
      Add
    </Button>
  );
}

function SectionActions({
  isPending,
  itemLabel,
  label,
  onAdd,
  onRemove,
}: {
  isPending: boolean;
  itemLabel: string;
  label: string;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1 print:hidden">
      <SectionAddButton itemLabel={itemLabel} onClick={onAdd} />
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              aria-label={`Remove ${label} section`}
              disabled={isPending}
              size="icon-xs"
              type="button"
              variant="ghost"
            />
          }
        >
          <TrashIcon />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {label} section?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the section and all of its items from
              this resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onRemove}>
              Remove section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ResumeDetailClient({ resumeId }: { resumeId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data: initialResume } = useSuspenseQuery(
    resumeDetailQuery(trpc, resumeId),
  );
  const [resume, setResume] = useState(initialResume);
  const [draftName, setDraftName] = useState(initialResume.name);
  const [isCopyingMarkdown, setIsCopyingMarkdown] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [addingSectionType, setAddingSectionType] =
    useState<ResumeSectionType | null>(null);
  const [editingSectionItem, setEditingSectionItem] =
    useState<EditableSectionItem | null>(null);
  const lastSyncedNameRef = useRef(initialResume.name);
  const pendingSaveNameRef = useRef<string | null>(null);
  const savedIndicatorTimeoutRef = useRef<number | null>(null);

  const updateTitleMutation = useMutation(
    trpc.resume.updateTitle.mutationOptions({
      onError: () => {
        pendingSaveNameRef.current = null;
        setShowSavedIndicator(false);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: async (updatedResume) => {
        lastSyncedNameRef.current = updatedResume.name;
        pendingSaveNameRef.current = null;
        setResume((currentResume) => ({
          ...currentResume,
          name: updatedResume.name,
        }));
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
      },
    }),
  );
  const addSectionItemMutation = useMutation(
    trpc.resume.addSectionItem.mutationOptions({
      onError: () => {
        toast.add({ title: "Failed to add item", type: "error" });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: (updatedResume) => {
        setResume(updatedResume);
        setAddingSectionType(null);
        toast.add({ title: "Resume item added", type: "success" });
      },
    }),
  );
  const updateSectionItemMutation = useMutation(
    trpc.resume.updateSectionItem.mutationOptions({
      onError: () => {
        toast.add({ title: "Failed to update item", type: "error" });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: (updatedResume) => {
        setResume(updatedResume);
        setEditingSectionItem(null);
        toast.add({ title: "Resume item updated", type: "success" });
      },
    }),
  );
  const deleteSectionItemMutation = useMutation(
    trpc.resume.deleteSectionItem.mutationOptions({
      onError: () => {
        toast.add({ title: "Failed to delete item", type: "error" });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: (updatedResume) => {
        setResume(updatedResume);
        setEditingSectionItem(null);
        toast.add({ title: "Resume item deleted", type: "success" });
      },
    }),
  );
  const removeSectionMutation = useMutation(
    trpc.resume.removeSection.mutationOptions({
      onError: () => {
        toast.add({ title: "Failed to remove section", type: "error" });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: (updatedResume) => {
        setResume(updatedResume);
        toast.add({ title: "Resume section removed", type: "success" });
      },
    }),
  );
  const duplicateMutation = useMutation(
    trpc.resume.duplicate.mutationOptions({
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: async (nextResume) => {
        router.push(`/resume/${nextResume.id}`);
      },
    }),
  );
  const deleteMutation = useMutation(
    trpc.resume.delete.mutationOptions({
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: async () => {
        router.push("/resume");
      },
    }),
  );
  const updateSummaryMutation = useMutation(
    trpc.resume.updateSummary.mutationOptions({
      onError: () => {
        toast.add({ title: "Failed to update summary", type: "error" });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.resume.pathFilter());
      },
      onSuccess: (_result, variables) => {
        setResume((currentResume) => ({
          ...currentResume,
          summary: variables.summary,
        }));
        setIsEditingSummary(false);
        toast.add({ title: "Summary updated", type: "success" });
      },
    }),
  );

  useEffect(() => {
    setResume(initialResume);
    setDraftName(initialResume.name);
    lastSyncedNameRef.current = initialResume.name;
    pendingSaveNameRef.current = null;
  }, [initialResume]);

  useEffect(() => {
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
  }, [draftName, resume.id, updateTitleMutation]);

  useEffect(() => {
    return () => {
      if (savedIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const { certificates, education } = partitionResumeEducation(
    resume.education,
  );
  const skillNames = getResumeSkillNames(resume);
  const activeSectionTypes = getActiveSectionTypes(
    resume,
    education.length,
    certificates.length,
    skillNames.length,
  );

  const copyMarkdownToClipboard = async () => {
    setIsCopyingMarkdown(true);

    try {
      const response = await fetch(`/resume/${resume.id}/markdown`);

      if (!response.ok) {
        toast.add({ title: "Failed to copy markdown", type: "error" });
        return;
      }

      const markdown = await response.text();
      await navigator.clipboard.writeText(markdown);
      toast.add({ title: "Copied markdown", type: "success" });
    } catch {
      toast.add({ title: "Failed to copy markdown", type: "error" });
    } finally {
      setIsCopyingMarkdown(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TooltipProvider delay={150}>
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
                <AddResumeSectionDropdown
                  addedSectionTypes={activeSectionTypes}
                  isPending={addSectionItemMutation.isPending}
                  onAdd={(type) => {
                    setAddingSectionType(type);
                  }}
                />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        render={<Link href={`/resume/${resume.id}/preview`} />}
                        size="icon-sm"
                        variant="ghost"
                        className="cursor-pointer"
                        aria-label="Preview resume"
                      />
                    }
                  >
                    <EyeIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Preview</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="cursor-pointer"
                        aria-label="Copy as markdown"
                        disabled={isCopyingMarkdown}
                        onClick={() => {
                          void copyMarkdownToClipboard();
                        }}
                      />
                    }
                  >
                    <ClipboardDocumentIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Copy as markdown</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="cursor-pointer"
                        aria-label="Print resume"
                        onClick={() => {
                          window.print();
                        }}
                      />
                    }
                  >
                    <PrinterIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
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
                      />
                    }
                  >
                    <Squares2X2Icon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <AlertDialogTrigger
                          render={
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="cursor-pointer"
                              aria-label="Delete resume"
                              disabled={deleteMutation.isPending}
                            />
                          }
                        />
                      }
                    >
                      <TrashIcon className="size-4" />
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
                        variant="destructive"
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

      <div className="mx-auto bg-white p-12 shadow-lg print:p-0 print:shadow-none">
        <div className="flex w-full max-w-[8.5in] flex-col gap-8">
          <ContactInfo contactInfo={resume.contactInfo} />

          <Section title="Summary">
            <ProfessionalSummary
              info={resume.summary}
              onEdit={() => {
                setIsEditingSummary(true);
              }}
            />
          </Section>

          {resumeSectionOptions.map((option) => {
            if (!activeSectionTypes.has(option.type)) return null;

            if (option.type === "EXPERIENCE") {
              return (
                <Section
                  action={
                    <SectionActions
                      isPending={removeSectionMutation.isPending}
                      itemLabel={option.itemLabel}
                      label={option.label}
                      onAdd={() => setAddingSectionType(option.type)}
                      onRemove={() =>
                        removeSectionMutation.mutate({
                          resumeId: resume.id,
                          type: option.type,
                        })
                      }
                    />
                  }
                  key={option.type}
                  title={option.label}
                >
                  <JobExperience
                    jobs={resume.experience}
                    onEditPosition={(position, companyName) => {
                      setIsEditingSummary(false);
                      setEditingSectionItem({
                        id: position.id,
                        item: {
                          accomplishments: position.accomplishments,
                          companyName,
                          endDate: position.endDate
                            ? toMonthInput(position.endDate)
                            : undefined,
                          location: position.location,
                          roleTitle: position.title,
                          startDate: toMonthInput(position.startDate),
                          type: "EXPERIENCE",
                        },
                      });
                    }}
                  />
                </Section>
              );
            }

            if (option.type === "EDUCATION") {
              return (
                <Section
                  action={
                    <SectionActions
                      isPending={removeSectionMutation.isPending}
                      itemLabel={option.itemLabel}
                      label={option.label}
                      onAdd={() => setAddingSectionType(option.type)}
                      onRemove={() =>
                        removeSectionMutation.mutate({
                          resumeId: resume.id,
                          type: option.type,
                        })
                      }
                    />
                  }
                  key={option.type}
                  layout="compact"
                  title={option.label}
                >
                  <EducationExperience
                    educationList={education}
                    onEdit={(item) =>
                      setEditingSectionItem({
                        id: item.id,
                        item: {
                          distinction: item.distinction,
                          endDate: toMonthInput(item.endDate),
                          institution: item.institution,
                          link: item.link || undefined,
                          location: item.location,
                          notes: item.notes ?? undefined,
                          startDate: toMonthInput(item.startDate),
                          type: "EDUCATION",
                        },
                      })
                    }
                  />
                </Section>
              );
            }

            if (option.type === "CERTIFICATION") {
              return (
                <Section
                  action={
                    <SectionActions
                      isPending={removeSectionMutation.isPending}
                      itemLabel={option.itemLabel}
                      label={option.label}
                      onAdd={() => setAddingSectionType(option.type)}
                      onRemove={() =>
                        removeSectionMutation.mutate({
                          resumeId: resume.id,
                          type: option.type,
                        })
                      }
                    />
                  }
                  key={option.type}
                  layout="compact"
                  title={option.label}
                >
                  <EducationExperience
                    educationList={certificates}
                    onEdit={(item) =>
                      setEditingSectionItem({
                        id: item.id,
                        item: {
                          distinction: item.distinction,
                          endDate: toMonthInput(item.endDate),
                          institution: item.institution,
                          link: item.link || undefined,
                          location: item.location,
                          notes: item.notes ?? undefined,
                          type: "CERTIFICATION",
                        },
                      })
                    }
                  />
                </Section>
              );
            }

            if (option.type === "SKILLS_SUMMARY") {
              return (
                <Section
                  action={
                    <SectionActions
                      isPending={removeSectionMutation.isPending}
                      itemLabel={option.itemLabel}
                      label={option.label}
                      onAdd={() => setAddingSectionType(option.type)}
                      onRemove={() =>
                        removeSectionMutation.mutate({
                          resumeId: resume.id,
                          type: option.type,
                        })
                      }
                    />
                  }
                  key={option.type}
                  layout="compact"
                  title={option.label}
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    {resume.skills.map((resumeSkill) => (
                      <Skill
                        key={resumeSkill.id}
                        onEdit={() =>
                          setEditingSectionItem({
                            id: resumeSkill.id,
                            item: {
                              name: resumeSkill.skill.name,
                              type: "SKILLS_SUMMARY",
                            },
                          })
                        }
                      >
                        {resumeSkill.skill.name}
                      </Skill>
                    ))}
                    {skillNames
                      .filter(
                        (skillName) =>
                          !resume.skills.some(
                            (resumeSkill) =>
                              resumeSkill.skill.name === skillName,
                          ),
                      )
                      .map((skillName) => (
                        <Skill key={skillName}>{skillName}</Skill>
                      ))}
                  </div>
                </Section>
              );
            }

            return (
              <Section
                action={
                  <SectionActions
                    isPending={removeSectionMutation.isPending}
                    itemLabel={option.itemLabel}
                    label={option.label}
                    onAdd={() => setAddingSectionType(option.type)}
                    onRemove={() =>
                      removeSectionMutation.mutate({
                        resumeId: resume.id,
                        type: option.type,
                      })
                    }
                  />
                }
                key={option.type}
                layout="compact"
                title={option.label}
              >
                <PatentList
                  patents={resume.patents}
                  onEdit={(patent) =>
                    setEditingSectionItem({
                      id: patent.id,
                      item: {
                        date: toMonthInput(patent.date),
                        description: patent.description,
                        link: patent.link ?? undefined,
                        title: patent.title,
                        type: "PATENTS",
                      },
                    })
                  }
                />
              </Section>
            );
          })}
        </div>
      </div>

      <MarkdownEditorDialog
        description="Update the resume-level professional summary."
        fieldLabel="Professional summary"
        isPending={updateSummaryMutation.isPending}
        open={isEditingSummary}
        title="Edit professional summary"
        value={resume.summary}
        onOpenChange={setIsEditingSummary}
        onSave={(summary) => {
          updateSummaryMutation.mutate({ resumeId: resume.id, summary });
        }}
      />

      <ResumeSectionItemDialog
        isPending={addSectionItemMutation.isPending}
        open={addingSectionType !== null}
        type={addingSectionType}
        onOpenChange={(open) => {
          if (!open) setAddingSectionType(null);
        }}
        onSave={(item) => {
          addSectionItemMutation.mutate({ ...item, resumeId: resume.id });
        }}
      />

      <ResumeSectionItemDialog
        initialItem={editingSectionItem?.item}
        isPending={
          updateSectionItemMutation.isPending ||
          deleteSectionItemMutation.isPending
        }
        open={editingSectionItem !== null}
        type={editingSectionItem?.item.type ?? null}
        onDelete={() => {
          if (!editingSectionItem) return;
          deleteSectionItemMutation.mutate({
            itemId: editingSectionItem.id,
            resumeId: resume.id,
            type: editingSectionItem.item.type,
          });
        }}
        onOpenChange={(open) => {
          if (!open) setEditingSectionItem(null);
        }}
        onSave={(item) => {
          if (!editingSectionItem) return;
          updateSectionItemMutation.mutate({
            ...item,
            itemId: editingSectionItem.id,
            resumeId: resume.id,
          });
        }}
      />
    </div>
  );
}
