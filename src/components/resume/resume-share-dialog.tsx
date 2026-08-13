"use client";

import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { z } from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Form, useAppForm } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "~/components/ui/toast";
import { permalinkFormSchema } from "~/lib/schemas/resume-identifiers";
import { useTRPC } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/shared";

type FormValues = z.infer<typeof permalinkFormSchema>;

export function ResumeShareDialog({
  permalink,
  resumeId,
}: {
  permalink: { slug: string } | null;
  resumeId: string;
}) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [origin, setOrigin] = useState("");
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useAppForm<FormValues>({
    defaultValues: { slug: "" },
    schema: permalinkFormSchema,
  });

  useEffect(() => setOrigin(window.location.origin), []);

  // These mutations change exactly one field of the resume, so patch it in
  // place rather than refetching the whole resume tree.
  const setCachedPermalink = (
    next: RouterOutputs["resume"]["createPermalink"] | null,
  ) => {
    queryClient.setQueryData(
      trpc.resume.getById.queryKey({ id: resumeId }),
      (previous) => (previous ? { ...previous, permalink: next } : previous),
    );
  };

  const createMutation = useMutation(
    trpc.resume.createPermalink.mutationOptions({
      onSuccess: (created) => {
        setCachedPermalink(created);
        reset({ slug: "" });
        toast.add({ title: "Public link created", type: "success" });
      },
    }),
  );
  const deleteMutation = useMutation(
    trpc.resume.deletePermalink.mutationOptions({
      onError: () => {
        toast.add({ title: "Failed to delete public link", type: "error" });
      },
      onSuccess: () => {
        setCachedPermalink(null);
        toast.add({ title: "Public link deleted", type: "success" });
      },
    }),
  );

  const publicLink = permalink
    ? { path: `/r/${permalink.slug}`, url: `${origin}/r/${permalink.slug}` }
    : null;

  const submit = handleSubmit(({ slug }) => {
    createMutation.mutate({
      resumeId,
      ...(slug ? { slug } : {}),
    });
  });

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            aria-label="Share resume"
            className="cursor-pointer"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <LinkIcon className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Public resume link</DialogTitle>
          <DialogDescription>
            Anyone with this link can view the latest saved version of this
            resume.
          </DialogDescription>
        </DialogHeader>

        {publicLink ? (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="public-resume-url">Public URL</Label>
              <Input id="public-resume-url" readOnly value={publicLink.url} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicLink.url);
                    toast.add({
                      title: "Public link copied",
                      type: "success",
                    });
                  } catch {
                    toast.add({
                      title: "Failed to copy public link",
                      type: "error",
                    });
                  }
                }}
              >
                <ClipboardDocumentIcon data-icon="inline-start" />
                Copy link
              </Button>
              <Button
                render={
                  <a href={publicLink.path} rel="noreferrer" target="_blank" />
                }
                type="button"
                variant="outline"
              >
                <ArrowTopRightOnSquareIcon data-icon="inline-start" />
                Open link
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      disabled={deleteMutation.isPending}
                      type="button"
                      variant="destructive"
                    />
                  }
                >
                  <TrashIcon data-icon="inline-start" />
                  Delete link
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete public link?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The URL will stop working immediately. Your resume will
                      not be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ resumeId })}
                    >
                      Delete link
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <Form onSubmit={submit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="public-resume-slug">Custom link (optional)</Label>
              <div className="flex items-center rounded-md border bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring/50">
                <span className="pl-3 text-sm text-muted-foreground">/r/</span>
                <Input
                  id="public-resume-slug"
                  aria-invalid={Boolean(errors.slug)}
                  className="border-0 shadow-none focus-visible:ring-0"
                  placeholder="your-name"
                  {...register("slug")}
                />
              </div>
              {errors.slug ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.slug.message}
                </p>
              ) : null}
              {createMutation.error ? (
                <p className="text-sm text-destructive" role="alert">
                  {createMutation.error.message}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Leave blank to generate a random private-looking link.
              </p>
            </div>
            <DialogFooter>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? "Creating…" : "Create link"}
              </Button>
            </DialogFooter>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
