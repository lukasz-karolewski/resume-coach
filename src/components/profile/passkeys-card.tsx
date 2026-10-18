"use client";

import { FingerprintIcon, TrashIcon } from "@phosphor-icons/react";
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
import { InlineEdit } from "~/components/ui/inline-edit";
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
  const [renamingId, setRenamingId] = useState<string>();

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

  const handleRename = async (id: string, name: string) => {
    const { error } = await passkey.updatePasskey({ id, name });
    if (error) toast.add({ title: "Failed to rename passkey", type: "error" });
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
          <ul className="divide-y">
            {passkeys.map((key) => (
              <li
                className="flex items-center gap-3 py-1.5 first:pt-0 last:pb-0"
                key={key.id}
              >
                <FingerprintIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <InlineEdit
                    className="min-w-0"
                    label="Passkey name"
                    onEditingChange={(editing) =>
                      setRenamingId(editing ? key.id : undefined)
                    }
                    onSave={(name) => handleRename(key.id, name)}
                    placeholder="Passkey"
                    value={key.name ?? ""}
                  />
                  {renamingId === key.id || !key.createdAt ? null : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Added <RelativeTime value={key.createdAt} />
                    </span>
                  )}
                </div>

                {renamingId === key.id ? null : (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          aria-label={`Remove ${passkeyLabel(key)}`}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={removingId === key.id}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        />
                      }
                    >
                      <TrashIcon />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Remove {passkeyLabel(key)}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          You will no longer be able to sign in with it. Delete
                          it from your device or password manager too.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleRemove(key.id)}
                        >
                          Remove passkey
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
