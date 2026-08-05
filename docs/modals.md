# Modal pattern (NiceModal + react-hook-form + tRPC types)

We use [`@ebay/nice-modal-react`](https://github.com/eBay/nice-modal-react) for
modal dialogs. The guiding idea: **a modal is a pure form that resolves with a
value. It does not know what the caller does with that value.** That keeps the
form decoupled from any single mutation, so the same modal component could
back multiple callers without forking.

## Pieces

- **Provider** — `NiceModal.Provider` is already mounted once in
  `src/app/layout.tsx` (via `~/components/providers`). Nothing else needs to
  wrap a provider.
- **Local typed helpers** — `src/components/modals/modal.ts` exports
  `createModal`/`showModal`, thin wrappers around `NiceModal.create`/
  `NiceModal.show` that carry the modal's resolved-value type end to end (see
  "Use the local helpers" below for why this is needed).
- **Reference implementation**: `src/components/dashboard/addJobModal.tsx`.

## The three principles

### 1. The modal resolves data; the caller owns the side effect

The modal calls `modal.resolve(value)` on submit and `modal.reject(...)` on
cancel. It contains **no `useMutation`, no `useRouter`, no toasts.** The caller
`await`s `showModal(...)` and decides what to do:

```tsx
// caller — owns the mutation, the refresh, and the error toast
import { showModal } from "~/components/modals/modal";
import { AddJobModal } from "~/components/dashboard/addJobModal";

async function handleClick() {
  try {
    const result = await showModal(AddJobModal);
    addJob.mutate(result);
  } catch {
    // modal was dismissed — nothing to do
  }
}
```

Because the modal never runs the mutation itself, a second caller could reuse
it with a different mutation without touching the modal component.

### 2. Types come from tRPC, not hand-maintained shapes

The modal's result type is derived from the router input via the helpers in
`src/trpc/shared.ts`:

```ts
import type { RouterInputs } from "~/trpc/shared";

export type AddJobFormResult = RouterInputs["job"]["addJob"];
```

This is the **client-safe** way to get the shape. The underlying Zod schema
lives in a server-only module and must not be imported into client code —
`RouterInputs` gives the same type without pulling server code into the
bundle. When the procedure changes, the modal's type follows automatically.

### 3. Form state uses react-hook-form

Use `react-hook-form` for form state. We do **not** use `@hookform/resolvers`
(not installed); rely on `register`/`handleSubmit` plus native validation
(`required`, `min`, …), as in `addJobModal.tsx`.

## Open/close lifecycle

Wire whichever dialog primitive you're using (shadcn `Dialog`, the headless
`Modal` in `~/components/ui/modal`, etc.) to NiceModal's handle:

```tsx
import { useModal } from "@ebay/nice-modal-react";
import { createModal } from "~/components/modals/modal";

export const AddJobModal = createModal<AddJobFormResult>(() => {
  const modal = useModal();
  const { register, handleSubmit } = useForm<AddJobFormResult>();

  function dismiss() {
    modal.reject(new Error("dismissed"));
    modal.remove();
  }

  const onSubmit = handleSubmit((values) => {
    modal.resolve(values);
    modal.remove();
  });

  return (
    <Modal open={modal.visible} onClose={dismiss} title="Add a job">
      <form onSubmit={onSubmit}>{/* fields + submit/cancel buttons */}</form>
    </Modal>
  );
});
```

See `addJobModal.tsx` for the full version, including `FormField`/`Input`
usage.

## Conventions & gotchas

- **Callers must `try/catch`.** Dismissing the modal rejects the promise; an
  uncaught one becomes an unhandled rejection. Always wrap `showModal`.
- **Use the local helpers, not direct `NiceModal.show`.** Declare app modals
  with `createModal<Result, Props>()` and open them with `showModal(...)`.
  `NiceModal.show` does not infer the resolved value from the modal component
  and accepts partial component props, so TypeScript can miss both missing
  required props and extra props. The local helpers in
  `src/components/modals/modal.ts` centralize that workaround:

  ```tsx
  import { createModal, showModal } from "~/components/modals/modal";

  type SomeModalProps = {
    title?: string;
  };

  export const SomeModal = createModal<SomeFormResult, SomeModalProps>(
    ({ title = "New item" }) => {
      // ...
    },
  );

  const result = await showModal(SomeModal, { title });
  ```

  For no-prop calls, omit the second argument: `await showModal(AddJobModal)`.

## Not every dialog needs NiceModal

Dialogs that are simple, controlled forms — open/closed state already lives in
the parent, and only one caller will ever render them — don't need the
NiceModal machinery. `src/components/resume/markdown-editor-dialog.tsx` is a
shadcn `Dialog` driven by `open`/`onOpenChange` props with an `onSave(value)`
callback instead of `modal.resolve`. It still follows principle #1 (no
`useMutation` inside the dialog; the caller owns the mutation) and is reused
as-is for both the professional-summary and per-position accomplishments
editors in `resume-detail-client.tsx` — same component, different `title`/
`description`/`fieldLabel` props, no forked "edit" variant.

Reach for NiceModal (`createModal`/`showModal`) when a modal needs to be
triggered imperatively from more than one place, or when you want the result
typed end-to-end without threading dialog state through the parent.
