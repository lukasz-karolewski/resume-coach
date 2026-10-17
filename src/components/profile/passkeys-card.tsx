"use client";

import { FingerprintIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { authClient, passkey } from "~/auth-client";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { RelativeTime } from "~/components/ui/relative-time";
import { toast } from "~/components/ui/toast";
import { isPasskeyPromptDismissed } from "~/lib/passkey-errors";

function passkeyLabel(key: { name?: string | null }) {
  return key.name || "Passkey";
}

export function PasskeysCard() {
  const {
    data: passkeys,
    error: listError,
    isPending,
  } = authClient.useListPasskeys();
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string>();

  const handleAdd = async () => {
    setIsAdding(true);
    const { error } = await passkey.addPasskey();
    setIsAdding(false);

    if (!error) {
      toast.add({ title: "Passkey added", type: "success" });
    } else if (
      "code" in error &&
      error.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"
    ) {
      toast.add({
        title: "This device already has a passkey for your account",
        type: "error",
      });
    } else if (!isPasskeyPromptDismissed(error)) {
      toast.add({ title: "Failed to add passkey", type: "error" });
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const { error } = await passkey.deletePasskey({ id });
    setRemovingId(undefined);

    toast.add(
      error
        ? { title: "Failed to remove passkey", type: "error" }
        : { title: "Passkey removed", type: "success" },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>
            <h2>Passkeys</h2>
          </CardTitle>
          <CardDescription>
            Sign in with your fingerprint, face, or device PIN instead of a
            password.
          </CardDescription>
        </div>
        <Button
          disabled={isAdding}
          onClick={handleAdd}
          type="button"
          variant="secondary"
        >
          <FingerprintIcon className="size-4" />
          Add a passkey
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? null : listError ? (
          <p className="text-sm text-muted-foreground">
            Your passkeys could not be loaded. Refresh the page to try again.
          </p>
        ) : !passkeys?.length ? (
          <p className="text-sm text-muted-foreground">
            You have no passkeys yet.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {passkeys.map((key) => (
              <li
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={key.id}
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{passkeyLabel(key)}</p>
                  {key.createdAt ? (
                    <p className="text-xs text-muted-foreground">
                      Added <RelativeTime value={key.createdAt} />
                    </p>
                  ) : null}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        disabled={removingId === key.id}
                        size="sm"
                        type="button"
                        variant="destructive"
                      />
                    }
                  >
                    Remove
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Remove {passkeyLabel(key)}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You will no longer be able to sign in with it. Delete it
                        from your device or password manager too.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleRemove(key.id)}
                      >
                        Remove {passkeyLabel(key)}
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
