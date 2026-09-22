"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { toast } from "~/components/ui/toast";
import {
  formatRelativeTime,
  formatTimestampTooltip,
  toDateTimeValue,
} from "~/lib/date-time";
import { useTRPC } from "~/trpc/react";

import { connectedAppsQuery } from "./profile-queries";

export function ConnectedAppsCard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: apps } = useSuspenseQuery(connectedAppsQuery(trpc));
  const disconnect = useMutation(
    trpc.profile.disconnectConnectedApp.mutationOptions({
      onError: () => {
        toast.add({ title: "Failed to disconnect app", type: "error" });
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.profile.pathFilter());
        toast.add({ title: "App disconnected", type: "success" });
      },
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Connected apps</h2>
        </CardTitle>
        <CardDescription>
          Apps you have authorized to use Resume Coach on your behalf.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no connected apps.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {apps.map((app) => (
              <li
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
                key={app.id}
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {app.uri ? (
                      <a
                        className="font-medium underline-offset-4 hover:underline"
                        href={app.uri}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {app.name}
                      </a>
                    ) : (
                      <p className="font-medium">{app.name}</p>
                    )}
                    <Badge variant={app.isActive ? "secondary" : "outline"}>
                      {app.isActive ? "Active" : "Reconnect required"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connected{" "}
                    <time
                      dateTime={toDateTimeValue(app.connectedAt)}
                      title={formatTimestampTooltip(app.connectedAt)}
                    >
                      {formatRelativeTime(app.connectedAt)}
                    </time>
                  </p>
                  <ul className="flex flex-wrap gap-2" aria-label="Permissions">
                    {app.permissions.map((permission) => (
                      <li key={permission}>
                        <Badge variant="outline">{permission}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        disabled={disconnect.isPending}
                        size="sm"
                        type="button"
                        variant="destructive"
                      />
                    }
                  >
                    Disconnect
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Disconnect {app.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Its current access and refresh tokens will stop working.
                        You can reconnect it later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={disconnect.isPending}
                        variant="destructive"
                        onClick={() =>
                          disconnect.mutate({ clientId: app.clientId })
                        }
                      >
                        Disconnect {app.name}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
