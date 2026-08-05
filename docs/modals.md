# Modal pattern (NiceModal + react-hook-form + tRPC types)

We use [`@ebay/nice-modal-react`](https://github.com/eBay/nice-modal-react) for
modal dialogs. The guiding idea: **a modal is a pure form that resolves with a
value. It does not know what the caller does with that value.** That keeps the
form decoupled from any single mutation, so the same modal serves different
contexts (e.g. a parent creating a goal for a child vs. a kid creating their
own).

## Pieces

- **Provider** — `NiceModal.Provider` is already mounted once in
  `src/app/layout.tsx` (via `~/components/providers`). Nothing else needs to
  wrap a provider.
- **Modal components** live in `src/components/modals/`.
- **Reference implementation**: `src/components/modals/goal-modal.tsx` and its
  callers `src/components/parent/add-goal-button.tsx` /
  `src/components/kid/goal-card.tsx`.

## The three principles

### 1. The modal resolves data; the caller owns the side effect

The modal calls `modal.resolve(value)` on submit and `modal.reject(...)` on
cancel. It contains **no `useMutation`, no `useRouter`, no toasts.** The caller
`await`s `showModal(...)` and decides what to do:

```tsx
// caller — owns the mutation, the refresh, and the error toast
import { showModal } from "~/components/modals/modal";

async function handleClick() {
  try {
    const result = await showModal(GoalModal);
    createGoalForChild.mutate({ childProfileId, ...result });
  } catch {
    // modal was dismissed — nothing to do
  }
}
```

The same `GoalModal` can back the kid flow by awaiting it and calling
`createGoal.mutate(result)` instead. The form is written once.

### 2. Types come from tRPC, not hand-maintained shapes

The modal's result type is derived from the router input via the helpers in
`src/trpc/shared.ts`:

```ts
import type { RouterInputs } from "~/trpc/shared";

export type GoalFormResult = RouterInputs["account"]["createGoal"];
```

This is the **client-safe** way to get the shape. The underlying Zod schema
(`createGoalInputSchema`) lives in a `"server-only"` module and must not be
imported into client code — `RouterInputs` gives the same type without pulling
server code into the bundle. When the procedure changes, the modal's type
follows automatically.

> Tip: pick the narrowest procedure as the base. `createGoal` (kid) is the
> common shape; the parent procedure `createGoalForChild` is just that plus a
> `childProfileId` the caller already has, so the caller spreads it in.

### 3. Form state uses react-hook-form

Use `react-hook-form` for form state. We do **not** use `@hookform/resolvers`
(not installed); rely on `useController`/`register` plus native validation
(`required`, `min`, …). `useController` lets you reuse shared controlled field
components (like `GoalFormFields`, whose emoji picker is a custom control)
without rewriting them:

```tsx
const { control, handleSubmit } = useForm<GoalFormResult>({
  defaultValues: { emoji: "", name: "", targetAmount: undefined },
});
const name = useController({ control, name: "name", rules: { required: true } });
// ...feed name.field.value / name.field.onChange into the shared field component
```

## Create-or-edit modals

**One modal backs both create and edit — do not fork a separate `EditFooModal`.**
Because the modal only resolves data and never runs the mutation, edit is just
"create, but prefilled, with different copy, and the caller runs the update
procedure instead." See `job-modal.tsx` / `goal-modal.tsx` and their edit
callers (`job-board-actions.tsx`, `goal-card.tsx`).

1. **Still a pure resolver.** The modal resolves the *create* input shape for
   both flows. It never learns whether it is creating or editing.
2. **Prefill via `defaultValues`.** Add an optional, form-shaped `defaultValues`
   prop and seed the form from it. Provide a small mapper next to the modal that
   turns an entity into those values (e.g. `goalDefaultsFromGoal(goal)`), mirroring
   `goalCatalogFormValuesFromItem`.
3. **Copy comes in as props, not a `mode` flag.** Pass `title` / `submitLabel`
   with create-flow defaults. No `mode: "create" | "edit"` prop — the modal
   must stay ignorant of the side effect.
4. **The caller owns create-vs-update.** Create callers behave as before. Edit
   callers `await` the result and run the update procedure, spreading in the id
   the modal never sees:

   ```tsx
   const result = await showModal(JobModal, {
     defaultValues,
     submitLabel: "Save changes",
     title: "Edit job",
   });
   updateJob.mutate({ ...result, jobId }); // job.update = create input + jobId
   ```

- **Gotcha — money fields hold strings.** Keep `amount` a **string** in form
  state and parse it once in `handleSubmit`. `MoneyInput` renders
  `<input type="number">`; feeding it a number makes React rewrite the DOM value
  on every keystroke, so a blanked field snaps to `"0"` (stranding a leading zero
  in front of whatever is typed next) and a `$4.50` prefill renders as `4.5`.
  Seed the string at the currency's precision —
  `amount.toFixed(currencyFractionDigits(currency))` — so zero-decimal
  currencies like JPY still seed `"1234"`. See `expense-modal.tsx`.
- **Gotcha — clear semantics.** A create-shaped payload turns a blanked field
  into `undefined`. If the update procedure reads `undefined` as "leave
  unchanged" and `null` as "clear" (as `account.updateGoal` does), a raw create
  payload silently can't clear a field. Because every field is prefilled in edit,
  a resolved `undefined` unambiguously means "the user cleared it" — map
  `undefined → null` before the update mutation. Keep that mapping in one helper
  (`goalUpdateInputFromResult`) so every edit caller shares it.

## Open/close lifecycle

Wire the shadcn `Dialog` to NiceModal's handle so close animations finish before
the modal unmounts:

```tsx
import { createModal } from "~/components/modals/modal";

export const GoalModal = createModal<GoalFormResult>(() => {
  const modal = useModal();

  function dismiss() {
    modal.reject(new Error("dismissed"));
    modal.hide();
  }

  const onSubmit = handleSubmit((values) => {
    const result: GoalFormResult = { /* ...map values... */ };
    modal.resolve(result);
    modal.hide();
  });

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open: boolean) => {
        if (!open) dismiss();
      }}
      onOpenChangeComplete={(open: boolean) => {
        if (!open) modal.remove(); // unmount after the close animation
      }}
    >
      <DialogContent>{/* DialogTitle + <form onSubmit={onSubmit}> */}</DialogContent>
    </Dialog>
  );
});
```

- `modal.hide()` triggers the close animation; `modal.remove()` (in
  `onOpenChangeComplete`) tears down the DOM afterwards.
- `DialogContent`/`DialogTitle` are required for accessibility.

## Conventions & gotchas

- **Callers must `try/catch`.** Dismissing the modal rejects the promise; an
  uncaught one becomes an unhandled rejection. Always wrap `showModal`.
- **Use the local helpers, not direct `NiceModal.show`.** Declare app modals
  with `createModal<Result, Props>()` and open them with `showModal(...)`.
  `NiceModal.show` does not infer the resolved value from the modal component
  and accepts partial component props, so TypeScript can miss both missing
  required props and extra props. The local helpers centralize that workaround:

  ```tsx
  import { createModal, showModal } from "~/components/modals/modal";

  type GoalModalProps = {
    defaultValues?: GoalModalDefaults;
    title?: string;
  };

  export const GoalModal = createModal<GoalFormResult, GoalModalProps>(
    ({ defaultValues, title = "New goal" }) => {
      // ...
    },
  );

  const result = await showModal(GoalModal, { defaultValues, title });
  ```

  For no-prop calls, omit the second argument: `await showModal(GoalModal)`.
  Keep string-registered modal IDs for truly global modals only; component-based
  modals preserve the result and prop types.
- **Submit then close is optimistic.** Because the modal resolves and hides
  before the caller's mutation runs, a failed mutation closes the modal and the
  user re-enters input (the caller shows a toast). This is fine for small forms.
  For long/expensive forms, prefer a variant where the modal `await`s a handler
  passed in via `showModal(Modal, { onSubmit })` and only closes on success.
- **Destructive confirmations** (e.g. removing a goal) use the shadcn
  `AlertDialog` inline in the component rather than a NiceModal — see
  `src/components/parent/parent-goal-card.tsx`.

## Composing actions onto cards

`GoalSummaryCard` (`src/components/shared/goals.tsx`) accepts `children` and an
`actions` slot, so feature-specific action buttons compose in without forking
the card. The kid `GoalCard` adds Edit/Purchase/Remove; the parent
`ParentGoalCard` adds Remove. Prefer this over building parallel card markup.
