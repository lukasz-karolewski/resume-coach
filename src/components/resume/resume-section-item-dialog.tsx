"use client";

import type { FormEvent, ReactNode } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { ResumeSectionType } from "~/lib/resume-sections";
import type { ResumeSectionItem } from "~/lib/schemas/resume-section-item";

const SECTION_ITEM_COPY: Record<
  ResumeSectionType,
  { description: string; label: string }
> = {
  CERTIFICATION: {
    description: "Add a certification or professional credential.",
    label: "certification",
  },
  EDUCATION: {
    description: "Add a school, degree, or educational program.",
    label: "education",
  },
  EXPERIENCE: {
    description: "Add a role and its most relevant accomplishments.",
    label: "experience",
  },
  PATENTS: {
    description: "Add an issued or pending patent.",
    label: "patent",
  },
  SKILLS_SUMMARY: {
    description: "Add one skill at a time to your skills section.",
    label: "skill",
  },
};

type ResumeSectionItemDialogProps = {
  initialItem?: ResumeSectionItem;
  isPending: boolean;
  onDelete?: () => void;
  onOpenChange: (open: boolean) => void;
  onSave: (item: ResumeSectionItem) => void;
  open: boolean;
  type: ResumeSectionType | null;
};

function getFormValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getOptionalFormValue(formData: FormData, name: string) {
  return getFormValue(formData, name) || undefined;
}

function buildSectionItem(
  type: ResumeSectionType,
  formData: FormData,
): ResumeSectionItem {
  if (type === "EXPERIENCE") {
    return {
      accomplishments: getFormValue(formData, "accomplishments"),
      companyName: getFormValue(formData, "companyName"),
      endDate: getOptionalFormValue(formData, "endDate"),
      location: getFormValue(formData, "location"),
      roleTitle: getFormValue(formData, "roleTitle"),
      startDate: getFormValue(formData, "startDate"),
      type,
    };
  }

  if (type === "EDUCATION") {
    return {
      distinction: getFormValue(formData, "distinction"),
      endDate: getFormValue(formData, "endDate"),
      institution: getFormValue(formData, "institution"),
      link: getOptionalFormValue(formData, "link"),
      location: getFormValue(formData, "location"),
      notes: getOptionalFormValue(formData, "notes"),
      startDate: getFormValue(formData, "startDate"),
      type,
    };
  }

  if (type === "CERTIFICATION") {
    return {
      distinction: getFormValue(formData, "distinction"),
      endDate: getFormValue(formData, "endDate"),
      institution: getFormValue(formData, "institution"),
      link: getOptionalFormValue(formData, "link"),
      location: getFormValue(formData, "location"),
      notes: getOptionalFormValue(formData, "notes"),
      type,
    };
  }

  if (type === "SKILLS_SUMMARY") {
    return { name: getFormValue(formData, "name"), type };
  }

  return {
    date: getFormValue(formData, "date"),
    description: getFormValue(formData, "description"),
    link: getOptionalFormValue(formData, "link"),
    title: getFormValue(formData, "title"),
    type,
  };
}

function DialogField({
  children,
  label,
  name,
}: {
  children: ReactNode;
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  );
}

function ExperienceFields({
  initialItem,
  isPending,
}: {
  initialItem?: Extract<ResumeSectionItem, { type: "EXPERIENCE" }>;
  isPending: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="Company" name="companyName">
          <Input
            defaultValue={initialItem?.companyName}
            disabled={isPending}
            id="companyName"
            name="companyName"
            required
          />
        </DialogField>
        <DialogField label="Role" name="roleTitle">
          <Input
            defaultValue={initialItem?.roleTitle}
            disabled={isPending}
            id="roleTitle"
            name="roleTitle"
            required
          />
        </DialogField>
      </div>
      <DialogField label="Location" name="location">
        <Input
          defaultValue={initialItem?.location}
          disabled={isPending}
          id="location"
          name="location"
          required
        />
      </DialogField>
      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="Start date" name="startDate">
          <Input
            defaultValue={initialItem?.startDate}
            disabled={isPending}
            id="startDate"
            name="startDate"
            required
            type="month"
          />
        </DialogField>
        <DialogField label="End date" name="endDate">
          <Input
            defaultValue={initialItem?.endDate}
            disabled={isPending}
            id="endDate"
            name="endDate"
            type="month"
          />
        </DialogField>
      </div>
      <DialogField label="Accomplishments" name="accomplishments">
        <Textarea
          defaultValue={initialItem?.accomplishments}
          disabled={isPending}
          id="accomplishments"
          name="accomplishments"
          placeholder="- Increased conversion by 20%"
          required
        />
      </DialogField>
    </>
  );
}

function EducationFields({
  initialItem,
  isPending,
  type,
}: {
  initialItem?: Extract<
    ResumeSectionItem,
    { type: "CERTIFICATION" | "EDUCATION" }
  >;
  isPending: boolean;
  type: "CERTIFICATION" | "EDUCATION";
}) {
  const isCertification = type === "CERTIFICATION";

  return (
    <>
      <DialogField
        label={isCertification ? "Issuer" : "Institution"}
        name="institution"
      >
        <Input
          defaultValue={initialItem?.institution}
          disabled={isPending}
          id="institution"
          name="institution"
          required
        />
      </DialogField>
      <DialogField
        label={isCertification ? "Certification" : "Degree or distinction"}
        name="distinction"
      >
        <Input
          defaultValue={initialItem?.distinction}
          disabled={isPending}
          id="distinction"
          name="distinction"
          required
        />
      </DialogField>
      <DialogField label="Location" name="location">
        <Input
          defaultValue={initialItem?.location}
          disabled={isPending}
          id="location"
          name="location"
          required
        />
      </DialogField>
      <div className="grid gap-4 sm:grid-cols-2">
        {!isCertification ? (
          <DialogField label="Start date" name="startDate">
            <Input
              defaultValue={
                initialItem?.type === "EDUCATION"
                  ? initialItem.startDate
                  : undefined
              }
              disabled={isPending}
              id="startDate"
              name="startDate"
              required
              type="month"
            />
          </DialogField>
        ) : null}
        <DialogField
          label={isCertification ? "Completion date" : "End date"}
          name="endDate"
        >
          <Input
            defaultValue={initialItem?.endDate}
            disabled={isPending}
            id="endDate"
            name="endDate"
            required
            type="month"
          />
        </DialogField>
      </div>
      <DialogField label="Link" name="link">
        <Input
          defaultValue={initialItem?.link}
          disabled={isPending}
          id="link"
          name="link"
          placeholder="https://"
          type="url"
        />
      </DialogField>
      <DialogField label="Notes" name="notes">
        <Textarea
          defaultValue={initialItem?.notes}
          disabled={isPending}
          id="notes"
          name="notes"
        />
      </DialogField>
    </>
  );
}

function PatentFields({
  initialItem,
  isPending,
}: {
  initialItem?: Extract<ResumeSectionItem, { type: "PATENTS" }>;
  isPending: boolean;
}) {
  return (
    <>
      <DialogField label="Patent title" name="title">
        <Input
          defaultValue={initialItem?.title}
          disabled={isPending}
          id="title"
          name="title"
          required
        />
      </DialogField>
      <DialogField label="Date" name="date">
        <Input
          defaultValue={initialItem?.date}
          disabled={isPending}
          id="date"
          name="date"
          required
          type="month"
        />
      </DialogField>
      <DialogField label="Link" name="link">
        <Input
          defaultValue={initialItem?.link}
          disabled={isPending}
          id="link"
          name="link"
          placeholder="https://"
          type="url"
        />
      </DialogField>
      <DialogField label="Description" name="description">
        <Textarea
          defaultValue={initialItem?.description}
          disabled={isPending}
          id="description"
          name="description"
          required
        />
      </DialogField>
    </>
  );
}

export function ResumeSectionItemDialog({
  initialItem,
  isPending,
  onDelete,
  onOpenChange,
  onSave,
  open,
  type,
}: ResumeSectionItemDialogProps) {
  if (!type) return null;

  const copy = SECTION_ITEM_COPY[type];
  const isEditing = initialItem !== undefined;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(buildSectionItem(type, new FormData(event.currentTarget)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-xl overflow-y-auto">
        <form
          className="grid gap-6"
          key={`${type}-${initialItem ? "edit" : "add"}-${open}`}
          method="post"
          onSubmit={handleSubmit}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit" : "Add"} {copy.label}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Update this ${copy.label} or delete it from the resume.`
                : copy.description}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {type === "EXPERIENCE" ? (
              <ExperienceFields
                initialItem={
                  initialItem?.type === "EXPERIENCE" ? initialItem : undefined
                }
                isPending={isPending}
              />
            ) : null}
            {type === "EDUCATION" || type === "CERTIFICATION" ? (
              <EducationFields
                initialItem={
                  initialItem?.type === "EDUCATION" ||
                  initialItem?.type === "CERTIFICATION"
                    ? initialItem
                    : undefined
                }
                isPending={isPending}
                type={type}
              />
            ) : null}
            {type === "SKILLS_SUMMARY" ? (
              <DialogField label="Skill" name="name">
                <Input
                  defaultValue={
                    initialItem?.type === "SKILLS_SUMMARY"
                      ? initialItem.name
                      : undefined
                  }
                  disabled={isPending}
                  id="name"
                  name="name"
                  required
                />
              </DialogField>
            ) : null}
            {type === "PATENTS" ? (
              <PatentFields
                initialItem={
                  initialItem?.type === "PATENTS" ? initialItem : undefined
                }
                isPending={isPending}
              />
            ) : null}
          </div>

          <DialogFooter className="sm:justify-between">
            {isEditing && onDelete ? (
              <Button
                disabled={isPending}
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete {copy.label}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                disabled={isPending}
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending
                  ? isEditing
                    ? "Saving…"
                    : "Adding…"
                  : isEditing
                    ? "Save changes"
                    : `Add ${copy.label}`}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
