"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
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
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

function createDraftId() {
  return `draft-${Math.random().toString(36).slice(2, 10)}`;
}

export type AccomplishmentProfileDraft = {
  roles: {
    id: string;
    companyName: string;
    entries: {
      id: string;
      content: string;
    }[];
    endMonth: string;
    location: string;
    startMonth: string;
    title: string;
  }[];
};

const emptyEntry = () => ({
  content: "",
  id: createDraftId(),
});

const emptyRole = () => ({
  companyName: "",
  endMonth: "",
  entries: [emptyEntry()],
  id: createDraftId(),
  location: "",
  startMonth: "",
  title: "",
});

function sanitizeProfile(profile: AccomplishmentProfileDraft) {
  return {
    roles: profile.roles
      .map((role) => ({
        companyName: role.companyName.trim(),
        endMonth: role.endMonth.trim() || undefined,
        entries: role.entries
          .map((entry) => ({
            content: entry.content.trim(),
          }))
          .filter((entry) => entry.content.length > 0),
        location: role.location.trim(),
        startMonth: role.startMonth.trim() || undefined,
        title: role.title.trim(),
      }))
      .filter((role) => role.companyName.length > 0 && role.title.length > 0),
  };
}

export function AccomplishmentProfileEditor({
  initialProfile,
}: {
  initialProfile: AccomplishmentProfileDraft;
}) {
  const router = useRouter();
  const [profile, setProfile] =
    useState<AccomplishmentProfileDraft>(initialProfile);

  const saveMutation = api.profile.saveAccomplishmentProfile.useMutation({
    onSuccess: () => {
      startTransition(() => {
        router.refresh();
      });
    },
  });

  const roles = profile.roles;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <CardTitle>Accomplishment profile</CardTitle>
          <CardDescription>
            Capture honest, role-specific wins here first. This becomes the
            source material for future tailored resumes and review drafts.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() =>
              setProfile((current) => ({
                roles: [...current.roles, emptyRole()],
              }))
            }
            variant="outline"
          >
            Add role
          </Button>
          <Button
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(sanitizeProfile(profile))}
          >
            {saveMutation.isPending ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {roles.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
            Add your current or past roles, then log raw accomplishments under
            each one while the details are still fresh.
          </div>
        ) : (
          roles.map((role, roleIndex) => (
            <div key={role.id} className="space-y-4 rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">
                    Role {roleIndex + 1}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Keep the notes raw. Resume polish comes later.
                  </p>
                </div>
                <Button
                  aria-label={`Remove role ${roleIndex + 1}`}
                  onClick={() =>
                    setProfile((current) => ({
                      roles: current.roles.filter(
                        (_, index) => index !== roleIndex,
                      ),
                    }))
                  }
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`role-company-${roleIndex}`}>Company</Label>
                  <Input
                    id={`role-company-${roleIndex}`}
                    value={role.companyName}
                    onChange={(event) =>
                      setProfile((current) => ({
                        roles: current.roles.map((currentRole, index) =>
                          index === roleIndex
                            ? {
                                ...currentRole,
                                companyName: event.target.value,
                              }
                            : currentRole,
                        ),
                      }))
                    }
                    placeholder="Example Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`role-title-${roleIndex}`}>Role title</Label>
                  <Input
                    id={`role-title-${roleIndex}`}
                    value={role.title}
                    onChange={(event) =>
                      setProfile((current) => ({
                        roles: current.roles.map((currentRole, index) =>
                          index === roleIndex
                            ? {
                                ...currentRole,
                                title: event.target.value,
                              }
                            : currentRole,
                        ),
                      }))
                    }
                    placeholder="Staff Engineer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`role-location-${roleIndex}`}>Location</Label>
                  <Input
                    id={`role-location-${roleIndex}`}
                    value={role.location}
                    onChange={(event) =>
                      setProfile((current) => ({
                        roles: current.roles.map((currentRole, index) =>
                          index === roleIndex
                            ? {
                                ...currentRole,
                                location: event.target.value,
                              }
                            : currentRole,
                        ),
                      }))
                    }
                    placeholder="Remote"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`role-start-${roleIndex}`}>
                      Start month
                    </Label>
                    <Input
                      id={`role-start-${roleIndex}`}
                      type="month"
                      value={role.startMonth}
                      onChange={(event) =>
                        setProfile((current) => ({
                          roles: current.roles.map((currentRole, index) =>
                            index === roleIndex
                              ? {
                                  ...currentRole,
                                  startMonth: event.target.value,
                                }
                              : currentRole,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`role-end-${roleIndex}`}>End month</Label>
                    <Input
                      id={`role-end-${roleIndex}`}
                      type="month"
                      value={role.endMonth}
                      onChange={(event) =>
                        setProfile((current) => ({
                          roles: current.roles.map((currentRole, index) =>
                            index === roleIndex
                              ? {
                                  ...currentRole,
                                  endMonth: event.target.value,
                                }
                              : currentRole,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Accomplishments</p>
                    <p className="text-sm text-muted-foreground">
                      One note per win, project, or measurable outcome.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      setProfile((current) => ({
                        roles: current.roles.map((currentRole, index) =>
                          index === roleIndex
                            ? {
                                ...currentRole,
                                entries: [...currentRole.entries, emptyEntry()],
                              }
                            : currentRole,
                        ),
                      }))
                    }
                    variant="outline"
                  >
                    Add accomplishment
                  </Button>
                </div>

                <div className="space-y-3">
                  {role.entries.map((entry, entryIndex) => (
                    <div
                      key={entry.id}
                      className="space-y-2 rounded-lg border bg-muted/20 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Label
                          htmlFor={`role-${roleIndex}-entry-${entryIndex}`}
                        >
                          Note {entryIndex + 1}
                        </Label>
                        <Button
                          aria-label={`Remove accomplishment ${entryIndex + 1}`}
                          onClick={() =>
                            setProfile((current) => ({
                              roles: current.roles.map((currentRole, index) =>
                                index === roleIndex
                                  ? {
                                      ...currentRole,
                                      entries:
                                        currentRole.entries.length > 1
                                          ? currentRole.entries.filter(
                                              (_, currentEntryIndex) =>
                                                currentEntryIndex !==
                                                entryIndex,
                                            )
                                          : [emptyEntry()],
                                    }
                                  : currentRole,
                              ),
                            }))
                          }
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                      <Textarea
                        id={`role-${roleIndex}-entry-${entryIndex}`}
                        rows={4}
                        value={entry.content}
                        onChange={(event) =>
                          setProfile((current) => ({
                            roles: current.roles.map((currentRole, index) =>
                              index === roleIndex
                                ? {
                                    ...currentRole,
                                    entries: currentRole.entries.map(
                                      (currentEntry, currentEntryIndex) =>
                                        currentEntryIndex === entryIndex
                                          ? {
                                              ...currentEntry,
                                              content: event.target.value,
                                            }
                                          : currentEntry,
                                    ),
                                  }
                                : currentRole,
                            ),
                          }))
                        }
                        placeholder="Reduced deploy time from 45 minutes to 8 minutes by leading the Kubernetes migration."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
