# Form validation

A form should tell the user what is wrong **as soon as it knows**, in our own
words. Two mechanisms get us there, and they stack:

1. **Timing and voice** — `useAppForm` + `<Form noValidate>` so react-hook-form
   reports a field when the user leaves it, using copy we wrote.
2. **One schema, both sides** — the form validates against the *same* zod schema
   the procedure enforces, so a rule can't drift between client and server.

Neither can check anything that needs server state — a balance, a uniqueness
constraint, a state transition. Those stay `UserFacingError`s and surface in the
dialog's error banner. See modals.md and errors.md.

## 1. Timing and voice

```tsx
import { Form, useAppForm } from "~/components/ui/form";

const { control, handleSubmit } = useAppForm<Values>({ defaultValues });
// ...
<Form noValidate onSubmit={handleSubmit(onValid)}>
```

- `useAppForm` is `useForm` with `mode: "onTouched"` and
  `reValidateMode: "onChange"`. Plain `useForm` defaults to `onSubmit`, which
  means a field the user already finished stays silent until they press the
  button.
- **`noValidate` is opt-in, not the `Form` default.** Auth and onboarding forms
  hold their state in `useState` and lean on the browser's own constraint
  validation. Turning it off globally would leave them with no validation at all.
- Before adding `noValidate` to a form, **move every native constraint into a
  rule or a schema first**. `required`, `min`, `max`, and `type="email"` stop
  being enforced the moment it goes on. `maxLength` is the exception: it limits
  typing rather than validating, so it keeps working — keep it *and* mirror it in
  a rule, since it does not constrain a prefilled value.
- Attributes that carry non-validation meaning stay: `type="email"` still picks
  the right mobile keyboard, `min` still drives number-input stepping.

### Wiring a field

Every controlled field needs `onBlur`, or `onTouched` never fires:

```tsx
const name = useController({ control, name: "name" });

<Field data-invalid={name.fieldState.invalid}>
  <FieldLabel htmlFor="name">Name</FieldLabel>
  <Input
    aria-invalid={name.fieldState.invalid}
    id="name"
    value={name.field.value}
    onBlur={name.field.onBlur}
    onChange={name.field.onChange}
  />
  <FieldError errors={[name.fieldState.error]} />
</Field>
```

`register(...)` supplies `onBlur` itself; read those errors off
`formState.errors`.

Composite controls need it too, and it is easy to miss because nothing warns —
a combobox input has to take `onBlur` explicitly. A control that genuinely
cannot take one, such as a select whose value only changes through a menu,
validates on submit instead. That is fine when the field can only hold a value
the UI offered.

## 2. One schema, both sides

Input schemas live in **`src/lib/schemas/`**, not in the `"server-only"` modules
that use them. Both the procedure and the form import the same object, so a
limit is written once:

```tsx
const expenseFormSchema = recordExpenseInputSchema.omit({ childProfileId: true });

useAppForm<AddExpenseResult>({
  defaultValues: { amount: undefined, description: undefined, ledgerAccountId },
  schema: expenseFormSchema,
});
```

- **`.omit()` the fields the caller supplies.** It mirrors the modal's result
  type (`Omit<RouterInputs[…], "childProfileId">`), so the two stay in step.
- **Messages are user-facing on both sides.** zod's defaults are developer-voice
  ("Too small: expected number to be >0") and these strings land in a dialog, so
  every constraint carries written copy. The same string is what the server
  returns for a request that skipped the client.
- **Blank means blank.** An id seeded as `""` passes a bare `z.string()`, so ids
  a select can leave empty use `.min(1, "Choose an account.")` — otherwise it
  fails server-side as a not-found instead of naming the field.
- **`defaultValues` may be partial.** It is a `DeepPartial`, so a money field can
  start `undefined` while the schema requires a number; the resolver reports it
  as "Enter an amount." That is why modals need no
  `if (values.amount === undefined) return` guards.

### Two traps

- **`useController` `rules` are silently ignored once a resolver is set.** Not a
  warning — the rule simply never runs. Anything the schema can't express has to
  live outside react-hook-form: a derived flag plus a disabled submit and an
  inline `Alert` (an overdraw warning, for instance), or a check inside the
  submit handler.
- **`.transform()` and `.default()` split a schema's input and output types**,
  and react-hook-form validates the *input* side. Where the wire schema has
  either, export a transform-free form variant alongside it in
  `src/lib/schemas/` and keep the wire schema authoritative on the server.

  The `schema` prop is typed `z.ZodType<TValues, TValues>` — **both** of zod's
  generics, so a split schema is caught at compile time rather than surfacing as
  a validation error that never clears. Pinning only the output
  (`z.ZodType<TValues>`) leaves the input as `unknown`, which is what once forced
  a cast in `useAppForm`.

  Which side you name `TValues` decides whether a split schema compiles, so type
  form values from the **input** side — `RouterInputs[…]` or `z.input<…>`, as
  `JobModal` does. `z.infer<…>` is the *output* type: pass it a defaulted schema
  and you get `_zod.input.<field>` is not assignable, because a `.default()`
  field is optional on input and required on output.

### The boundary

A scoped `noRestrictedImports` rule in `biome.json` fails if any schema module
imports `"server-only"`, `~/server/*`, generated Prisma, or `~/auth`. A schema
that reaches for the database stops being importable from a client component,
and the sharing quietly reverts to duplication.

The rule can only police files that are already in `src/lib/schemas/` — it
cannot reach a schema declared somewhere else. A new procedure input therefore
belongs here from the start; a schema left in its `"server-only"` module is
invisible to both the rule and any form that would want to share it.

An enum a schema needs is declared as a plain `as const` array in client-safe
code and imported from there — `jobStatuses` in `schemas/job.ts`,
`EDUCATION_TYPES` in `schemas/resume.ts`, `RESUME_SECTION_TYPES` in
`lib/resume-sections.ts`. Reaching into `~/generated/prisma` for the same values
is what the rule blocks, so the array is the copy that keeps the schema portable.

### Choosing a strategy

| Form state | Validation |
|---|---|
| Typed values matching a procedure input | shared schema via `useAppForm({ schema })` — the default |
| String-shaped state that would need a coercing form schema | hand-written react-hook-form rules |
| `useState`, with a single cross-field rule | enforce it with a disabled submit |
| `useState` auth/onboarding forms | native browser validation (no `noValidate`) |
