"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { formatMonthInput } from "~/lib/date-time";
import { useTRPC } from "~/trpc/react";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AccomplishmentProfileEditor } from "./accomplishment-profile-editor";
import {
  accomplishmentProfileQuery,
  userInformationQuery,
} from "./profile-queries";

export function ProfilePageClient() {
  const trpc = useTRPC();
  const { data: userInformation } = useSuspenseQuery(
    userInformationQuery(trpc),
  );
  const { data: accomplishmentProfile } = useSuspenseQuery(
    accomplishmentProfileQuery(trpc),
  );

  const initialProfile = {
    roles:
      accomplishmentProfile?.roles.map((role) => ({
        companyName: role.companyName,
        endMonth: formatMonthInput(role.endDate),
        entries: role.entries.map((entry) => ({
          content: entry.content,
          id: entry.id.toString(),
        })),
        id: role.id.toString(),
        location: role.location ?? "",
        startMonth: formatMonthInput(role.startDate),
        title: role.title,
      })) ?? [],
  };

  return (
    <div className="grid w-full gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account identity and import workflow.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <CardTitle>Account information</CardTitle>
          <Button variant="secondary">Import your LinkedIn profile</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {userInformation?.name || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {userInformation?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AccomplishmentProfileEditor initialProfile={initialProfile} />
    </div>
  );
}
