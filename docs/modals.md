# Modal pattern (NiceModal + react-hook-form + tRPC types)

Modal dialogs use [`@ebay/nice-modal-react`](https://github.com/eBay/nice-modal-react).
The guiding idea: **a modal is a pure form that resolves with a value. It does
not know what the caller does with that value.** That keeps the form decoupled
from any single mutation, so the same modal serves different contexts (a parent
creating a goal for a child vs. a kid creating their own).

## Pieces

- **Provider** — `NiceModal.Provider` is mounted once in the root layout via
  `~/components/providers`. Nothing else wraps a provider.
- **Modal components** live in `src/components/modals/`.
- **`createModal` / `showModal`** (`modal.ts`) — local typed wrappers over
  NiceModal (see [Conventions](#conventions--gotchas)).
- **`useModalForm`** (`use-modal-form.tsx`) — the lifecycle hook that owns every
  modal's open/close handling and its submit path.
- **Test helpers** (`test-support.ts`) — `serverError()` rejects an `onSubmit`
  the way the server would; `submitFromModal()` drives tests that mock
  `showModal`.

## The three principles

### 1. The modal resolves data; the caller owns the side effect

The modal resolves with a value on submit and rejects on cancel. It contains
**no `useMutation`, no `useRouter`, no toasts.** The caller `await`s
`showModal(...)` and decides what to do:

```tsx
// caller — owns the mutation, the refresh, and the error toast
async function handleClick() {
  try {
    const result = await showModal(GoalModal);
    createGoalForChild.mutate({ childProfileId, ...result });
  } catch {
    // modal was dismissed — nothing to do
  }
}
```

The same `GoalModal` backs the kid flow by awaiting it and calling
`createGoal.mutate(result)` instead. The form is written once.

That fire-and-forget shape is the **optimistic** path: the dialog is already
gone by the time the mutation runs, so a rejection can only surface as a toast.
For anything the server can legitimately refuse, use the awaited variant in
[Awaiting the caller's mutation](#awaiting-the-callers-mutation) — the modal
still owns no mutation, it just waits for one.

### 2. Types come from tRPC, not hand-maintained shapes

The modal's result type is derived from the router input via `RouterInputs`
(`src/trpc/shared.ts`):

```ts
export type GoalFormResult = RouterInputs["account"]["createGoal"];
```

This is the **client-safe** way to get the resolved payload shape. Shared zod
schemas live in `src/lib/schemas`, where both the form and the procedure import
them; `RouterInputs` keeps the modal result tied to the procedure without
redeclaring that type, so it follows the procedure automatically.

> Tip: pick the narrowest procedure as the base. The kid `createGoal` is the
> common shape; the parent `createGoalForChild` is that plus a `childProfileId`
> the caller already has, so the caller spreads it in.

### 3. Form state uses react-hook-form

Use `useAppForm` (`~/components/ui/form`) for form state — `useForm` with
`mode: "onTouched"` and `reValidateMode: "onChange"` — paired with
`<Form noValidate>`. Most modals
validate against the procedure's own zod schema through `useAppForm`'s `schema`
option; the rest use `useController`/`register` rules. **See form-validation.md**,
including the two traps (`rules` are ignored once a resolver is set, and
`.transform()`/`.default()` split a schema's input and output types).

`useController` lets you reuse shared controlled field components without
rewriting them:

```tsx
const { control, handleSubmit } = useAppForm<GoalFormValues>({
  defaultValues: { emoji: "", name: "", targetAmount: undefined, url: "" },
  schema: goalFormSchema,
});
const name = useController({ control, name: "name" });
// ...feed name.field.value / onChange / onBlur and name.fieldState.error into
// the shared field component
```

## Create-or-edit modals

**One modal backs both create and edit — do not fork a separate `EditFooModal`.**
Because the modal only resolves data and never runs the mutation, edit is just
"create, but prefilled, with different copy, and the caller runs the update
procedure instead."

1. **Still a pure resolver.** The modal resolves the *create* input shape for
   both flows. It never learns whether it is creating or editing.
2. **Prefill via `defaultValues`.** Add an optional, form-shaped `defaultValues`
   prop and seed the form from it. Provide a small mapper next to the modal that
   turns an entity into those values (e.g. `goalDefaultsFromGoal(goal)`).
3. **Copy comes in as props, not a `mode` flag.** Pass `title` / `submitLabel`
   with create-flow defaults. No `mode: "create" | "edit"` prop — the modal must
   stay ignorant of the side effect.
4. **The caller owns create-vs-update.** Edit callers `await` the result and run
   the update procedure, spreading in the id the modal never sees:

   ```tsx
   const result = await showModal(JobModal, {
     defaultValues,
     submitLabel: "Save changes",
     title: "Edit job",
   });
   updateJob.mutate({ ...result, jobId }); // update input = create input + id
   ```

- **Gotcha — money fields hold strings.** Keep `amount` a **string** in form
  state and parse it once in `handleSubmit`. `MoneyInput` renders
  `<input type="number">`; feeding it a number makes React rewrite the DOM value
  on every keystroke, so a blanked field snaps to `"0"` (stranding a leading zero
  in front of whatever is typed next) and a `$4.50` prefill renders as `4.5`.
  Seed the string at the currency's precision —
  `amount.toFixed(currencyFractionDigits(currency))` — so zero-decimal
  currencies like JPY still seed `"1234"`.
- **Gotcha — clear semantics.** A create-shaped payload turns a blanked field
  into `undefined`. If the update procedure reads `undefined` as "leave
  unchanged" and `null` as "clear", a raw create payload silently can't clear a
  field. Because every field is prefilled in edit, a resolved `undefined`
  unambiguously means "the user cleared it" — map `undefined → null` before the
  update mutation, in one shared helper so every edit caller agrees.

## Open/close lifecycle

`useModalForm` owns the whole lifecycle — the NiceModal handle, the Dialog
wiring, and the submit path. Every modal uses it; none touch `useModal()`
directly.

```tsx
type GoalModalProps = ModalFormProps<GoalFormResult> & { title?: string };

export const GoalModal = createModal<GoalFormResult, GoalModalProps>(
  ({ onSubmit, title = "New goal" }) => {
    const { dialogProps, error, isPending, submit } =
      useModalForm<GoalFormResult>(onSubmit);

    const submitForm = handleSubmit((values) =>
      submit({ /* ...map values... */ }),
    );

    return (
      <Dialog {...dialogProps}>
        <DialogContent>{/* DialogTitle + <Form onSubmit={submitForm}> */}</DialogContent>
      </Dialog>
    );
  },
);
```

- `dialogProps` carries `open` / `onOpenChange` / `onOpenChangeComplete`.
  `modal.hide()` triggers the close animation; `modal.remove()` (in
  `onOpenChangeComplete`) tears down the DOM afterwards.
- `DialogContent`/`DialogTitle` are required for accessibility.
- `submit(result)` is the only exit: with no `onSubmit` prop it resolves and
  hides immediately; with one it awaits the caller first (next section).
- Dismissal is ignored while a submit is in flight — one guard in the hook
  covers Escape, the backdrop, and the X button, since all three route through
  `onOpenChange`.

## Awaiting the caller's mutation

**Use this whenever the procedure can throw a `UserFacingError`** — insufficient
funds, split percentages that don't total 100, a duplicate invite. Those are
expected refusals a user can act on, and closing the dialog first throws away
everything they typed.

Pass the side effect in as `onSubmit`. The modal awaits it and **only closes on
success**; on rejection it stays open, keeps every field, and renders the
server's message.

```tsx
// caller
await showModal(AddExpenseModal, {
  accounts,
  childName,
  onSubmit: (result) => recordExpense.mutateAsync({ childProfileId, ...result }),
});
```

```tsx
// modal — one line of markup, above the footer
<FieldError>{error}</FieldError>
<DialogFooter>
  <Button disabled={isPending} type="submit">
    {isPending ? "Adding..." : "Add expense"}
  </Button>
</DialogFooter>
```

`FieldError` (`~/components/ui/field`) already renders `role="alert"` in
`text-destructive` and returns `null` when empty, so no wrapper is needed.

The rules that keep this honest:

- **Nothing runs after the `await`.** The side effect lives *in* the handler;
  the awaited `showModal` promise is now a completion signal. Calling `.mutate()`
  after it fires the request twice. Keep the `try/catch` — dismissal still
  rejects.
- **The mutation must not carry an `onError` toast.** `mutateAsync` rejecting
  does *not* suppress `onError`, so a leftover toast reports the same failure
  twice. Watch for mutations serving both a modal and a non-modal path: split
  the shared options object rather than sharing one with a toast in it.
- **Only server-authored messages are shown.** Render `error.message` only when
  the error carries a tRPC `data.code`; a dropped connection or a handler bug
  falls back to generic copy, because `withErrorHandling` (`src/server/utils.ts`)
  is what guarantees the message is fit for a kid to read. See errors.md.
- **Invalidation is awaited, deliberately.** `mutateAsync` waits for
  mutation-level `onSettled`, so the dialog closes only once the screen behind
  it holds fresh data — no stale flash. This is safe because `invalidateQueries`
  swallows refetch failures; **never pass `throwOnError`** to an invalidation
  inside an awaited `onSettled`, or a flaky refetch would present a committed
  mutation as a failure the user retries.
- **Optimistic updates still apply.** With `optimisticChildBalanceOptions`
  (`~/lib/kid-money-actions`) the balance behind the dialog moves on submit and
  rolls back on rejection. Drop only its toast *argument*; the helper's own
  `onError` does the rollback.

## Conventions & gotchas

- **Callers must `try/catch`.** Dismissing the modal rejects the promise; an
  uncaught one becomes an unhandled rejection. Always wrap `showModal`.
- **Use the local helpers, not direct `NiceModal.show`.** Declare modals with
  `createModal<Result, Props>()` and open them with `showModal(...)`.
  `NiceModal.show` does not infer the resolved value from the modal component
  and accepts partial component props, so TypeScript can miss both missing
  required props and extra ones. The local helpers centralize that workaround.
  For no-prop calls, omit the second argument: `await showModal(GoalModal)`.
  Keep string-registered modal IDs for truly global modals only; component-based
  modals preserve the result and prop types.
- **Destructive confirmations** are inline `AlertDialog`s when the confirmation
  belongs to one card. Reusable ones — such as a type-the-phrase confirm — are
  NiceModals like every other dialog.

## Composing actions onto cards

Shared summary cards accept `children` and an `actions` slot, so feature-specific
buttons compose in without forking the card (kid goal cards add
Edit/Purchase/Remove; the parent card adds Remove). Prefer this over building
parallel card markup.
