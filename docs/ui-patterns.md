# Shared UI patterns

## Forms

Use `Form` from `src/components/ui/form.tsx` instead of a bare `<form>`. It is a
thin `<form>` wrapper that owns the vertical rhythm (`flex flex-col gap-4`)
between a form's parts.

Inside it, build fields out of the shadcn field primitives in
`src/components/ui/field.tsx`:

```tsx
<Form onSubmit={onSubmit}>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="gift-amount">Amount</FieldLabel>
      <MoneyInput id="gift-amount" … />
    </Field>
  </FieldGroup>
  <DialogFooter>
    <Button type="submit">Send gift</Button>
  </DialogFooter>
</Form>
```

Rules that follow from how the primitives are built:

- **One `Field` per control.** `Field` renders `role="group"` and is meant to own
  a single input plus its label and description. Don't use it as a generic
  layout box for a whole sub-form.
- **`FieldLabel` + `htmlFor`, not `aria-label`.** When the surrounding row
  already shows the name, keep the label and add `className="sr-only"` rather
  than dropping it.
- **`FieldGroup` only spaces its own children.** Anything sitting *beside* a
  group — a validation message, a `DialogFooter`, a submit button — gets its gap
  from `Form`. This is why the gap lives on the form and not on each group.
- **`FieldSet` + `FieldLegend variant="label"`** for related option groups
  (allowance type, push types, allocation rows).
- **Horizontal rows** (label on the left, a `Switch` on the right) use
  `<Field orientation="horizontal">`, with `FieldContent` wrapping the label and
  description when there is a description.

### Divergences from upstream shadcn

`FieldGroup` uses `gap-4`, not upstream's `gap-7` — 7 is tuned for full-page
marketing forms and reads as disconnected in our dialogs and settings cards. If
you re-run the shadcn CLI for `field`, re-apply this.

## Section headers

Use `SectionHeader` from `src/components/ui/section-header.tsx` for repeated
workspace sections that need a title, optional description, count badge, and
right-aligned actions. Pair the `id` prop with the surrounding section's
`aria-labelledby` so the section is a named region.

## Responsive create buttons

Use `ResponsiveCreateButton` from
`src/components/ui/responsive-create-button.tsx` for primary create actions in
parent workspaces. It renders as icon-only on small screens and icon plus label
on desktop, matching the job board and goal catalog.

## Money inputs

Use `MoneyInput` from `src/components/ui/money-input.tsx` for every dollar-amount
field. It wraps the shadcn `Input` and bakes in the shared money defaults
(`type="number"`, `inputMode="decimal"`, `step="0.01"`, `placeholder="0.00"`)
plus an integrated leading `$` sign, so the `$` no longer belongs in the field
label (`Reward`, not `Reward ($)`).

It stays purely presentational — no parsing, no state — so it drops into
react-hook-form `register`, controlled string state, and controlled number state
alike. Call sites only declare what is unique to the field: the `min` floor (use
`min={0.01}` for amounts that must be positive, `min={0}` for settings), an
optional `max`, and their own value/onChange wiring. Layout classes (widths,
margins) go on `className`, which targets the complete control. Inner input
styling stays private to the primitive.

This is **money only.** Percentage and other unit fields (APR, split
percentages, penalty weeks) use the purpose-specific controls below.

## Numeric inputs

Use `PercentageInput` from `src/components/ui/numeric-input.tsx` for percentage
fields. It includes the `%` suffix, defaults to the `0`–`100` range with a
`0.01` step, and requests a decimal mobile keypad. For whole percentages such
as auto-save allocation, pass `step={1}`; the component then requests a
digits-only keypad.

Use `IntegerInput` from the same module for counts and whole-number quantities.
It fixes the semantic type to `number`, defaults to `step={1}`, and requests a
digits-only mobile keypad. Call sites still provide their domain limits such as
`min={0}`.

Money, percentage, and integer inputs default to `autoComplete="off"` so
browsers do not offer unrelated contact data for these app-specific values.
For `MoneyInput` and `PercentageInput`, `className` targets the complete control,
including its `$`/currency or `%` adornment. Call sites should use it only for
layout such as width; the primitive owns inner-input alignment and styling.

## Account cards

Use `AccountBalanceCard` from `src/components/shared/money.tsx` for every
account balance on a dashboard — main, savings, extra spending, and goals.
Goals are accounts, so `GoalSummaryCard` (`src/components/shared/goals.tsx`)
composes it and only adds the progress bar plus whatever actions the surface
needs via `children`. Do not hand-roll a bordered `div` for a balance — that is
what made goals look foreign next to the accounts beside them.

`size="featured"` scales the balance and the icon together for the kid
surfaces. Every card on one dashboard uses the same size, so the choice belongs
to the surface, not the card: the kid dashboard passes `featured` to its
balances *and* its goals; the parent child dashboard passes nothing to either.

Account icons follow the account name (`Trip cash 🇪🇺`) on cards and in the
name-then-emoji forms (goal, goal idea, job), and the emoji is `aria-hidden` —
it decorates a name the screen reader already reads. It is deliberately larger
than the label beside it; the icon is what someone scans for. Pickers are the
other exception: `AccountOptionRow` leads with the icon, because a list of
options is scanned by icon before it is read. As everywhere else, an account
without an emoji simply renders without one.

## Account selection

Use `AccountSelect` from `src/components/shared/money.tsx` for every place a
parent or kid picks a ledger account — deposits, expenses, transfers, currency
exchange, deposit destinations. Every option shows the same three things: the
account's icon, its name, and its current balance in its own currency. Someone
choosing where money comes from or goes should never have to leave the dialog to
check what is in an account.

Callers pass `SelectableAccount`, which requires `balance` and `currency`, so a
picker cannot be wired up without them. Select `emoji` in the same mapping:
accounts own their icon.

New balance accounts are created with `DEFAULT_ACCOUNT_EMOJI` (`src/lib/ledger.ts`)
for their type; existing rows were backfilled in
`prisma/migrations/20260727130000_backfill_balance_account_emoji`. That constant
is a creation default, not a lookup table — do not map a type to an icon at
render time. An account without an emoji simply renders without one.

`formatAccountOption` stays a plain string — Base UI uses it for the select's
typeahead and trigger fallback, and tests use it to describe an option.

## Timezone selection

Use `TIMEZONE_OPTION_GROUPS` from `src/lib/timezones.ts` for every family
timezone picker. The groups are labeled with each timezone's current UTC offset
and are sorted west-to-east, while preserving the shared curated choices and
human-readable location labels. Render each group with `SelectGroup` and
`SelectLabel`; do not introduce a free-text timezone field or a route-specific
list.

## Kid selection

Use `KidSelectionField` from `src/components/parent/kid-selection-field.tsx`
when a parent chooses which kids can access an item.

- `mode="everyone"` is for job eligibility, where an empty selection means all
  kids.
- `mode="selected"` is for catalog availability, where selected ids are the kids
  who can see the item.

When discussing catalog entries in parent-facing copy, use **goal ideas** or
**things kids can save for**. Avoid **reward ideas** unless the entry is
explicitly a behavioral reward, and avoid exposing implementation-source labels
in the UI.

## App shell

Every signed-in role area (parent, kid, relative, super admin) shares one
shell: sticky gnav, content, footer, plus a floating bottom nav pill on
mobile. Do not hand-roll this markup in a layout — compose the primitives
from `src/components/ui/app-shell.tsx`:

- `AppShell` — the `min-h-screen` header/content/footer grid.
- `AppHeader` — the sticky top bar. Children flow left-to-right (brand,
  badges, nav); pass right-aligned actions (usually `<UserButton />`) via
  `endSlot`. The brand slot varies by role: parent/relative/super-admin use
  `HeaderLogoLink`, the kid shell renders a themed "Hi, {name}!" greeting.
- `AppContent` — the muted `<main>` with the centered `max-w-6xl` container;
  override width via `className` (the relative area uses `max-w-2xl`).
- `MobileNavBar` — the fixed bottom pill shown below `sm`. Put a nav inside
  and give items `flex-1 justify-center`; the pill hides itself when the nav
  renders nothing.

Nav link lists go through `NavLinks` (`src/components/ui/nav-links.tsx`): it
owns active-state detection (`exact` for section roots, prefix otherwise) and
a11y wiring (`aria-current`, labelled `nav`). `ParentNav` and `KidNav` are
thin item/styling wrappers around it — follow that shape for a new role nav
instead of mapping links by hand.

Layout auth guards live in `src/auth-guards.ts`:

- `requireSession(redirectTo?)` — session-only areas (e.g. `(auth)`,
  super-admin, which layers its own staff check on top).
- `requireFamilyMember(role, { signedOutRedirect? })` — role-gated areas;
  redirects members of other roles to their own home and family-less users to
  onboarding.
- `privateLayoutMetadata` — shared `robots: noindex` metadata for signed-in
  layouts. Keep `export const dynamic = "force-dynamic"` as a literal in each
  layout (Next.js requires segment config to be statically analyzable).

## Page data loading

Every data-backed RSC page follows one pattern: call `prefetch()` for the
page's tRPC queries, then return the page body inside `PrefetchBoundary`
(`src/trpc/hydrate-client.tsx`) with the page-shaped skeleton as `fallback`:

```tsx
export default function ParentJobsPage() {
  prefetch(parentQueries.jobs(trpc));

  return (
    <PrefetchBoundary fallback={<ParentJobsSkeleton />}>
      <ParentJobs />
    </PrefetchBoundary>
  );
}
```

`PrefetchBoundary` dehydrates the per-request QueryClient (including
still-pending prefetches, which stream to the client) and suspends with the
fallback. Two rules keep it correct:

- It belongs in the **page**, after all `prefetch()` calls — layouts and pages
  render in parallel, so a layout-level boundary cannot see queries a page
  prefetches. The one exception is a layout whose own shell consumes
  prefetched data (the kid shell), which gets its own boundary *in addition
  to* the per-page ones.
- The `fallback` is the page's skeleton component, so client-side navigation
  between pages under the same shell shows a content-shaped placeholder.

For the very first document load, `src/app/loading.tsx` renders a branded
splash: the root layout is synchronous, so the splash streams in the first
HTML flush while the auth-guard layouts (`requireSession` /
`requireFamilyMember`) resolve. Do not add blocking data work to the root
layout — that would delay the splash.
