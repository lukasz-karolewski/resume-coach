"use client";

import { useModal } from "@ebay/nice-modal-react";
import { useState } from "react";

export type ModalFormProps<Result> = {
  onSubmit?: (result: Result) => Promise<unknown>;
};

export function useModalForm<Result>(
  onSubmit?: ModalFormProps<Result>["onSubmit"],
) {
  const modal = useModal();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  function dismiss() {
    if (isPending) return;
    modal.reject(new Error("dismissed"));
    modal.hide();
  }

  async function submit(result: Result) {
    setError(undefined);
    setIsPending(true);

    try {
      await onSubmit?.(result);
      modal.resolve(result);
      modal.hide();
    } catch {
      setError("We couldn't save this application. Try again.");
    } finally {
      setIsPending(false);
    }
  }

  return {
    dialogProps: {
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
      onOpenChangeComplete: (open: boolean) => {
        if (!open) modal.remove();
      },
      open: modal.visible,
    },
    error,
    isPending,
    submit,
  };
}
