# Shared UI patterns

New building blocks go in `src/components/ui` (or `src/components/shared` when
they carry domain shape) as composable primitives, not as route-local markup.
The sections below are the contracts those primitives own.

## Forms

Use `Form` from `src/components/ui/form.tsx` instead of a bare `<form>`. It is a
thin wrapper that owns the vertical rhythm (`flex flex-col gap-4`) between a
form's parts. Inside it, build fields out of the shadcn field primitives in
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

- **Use `FormField` for the common labelled-control-error shape.** Pass its
  `error`, `htmlFor`, and `label`; it applies `data-invalid` to the field,
  `aria-invalid` to the control, and renders the matching `FieldError`. Drop to
  the lower-level primitives when a field has descriptions, alerts, or other
  custom content.
- **One `Field` per control.** `Field` renders `role="group"` and owns a single
  input plus its label and description. It is not a generic layout box for a
  whole sub-form.
- **`FieldLabel` + `htmlFor`, not `aria-label`.** When the surrounding row
  already shows the name, keep the label and add `className="sr-only"` rather
  than dropping it.
- **`FieldGroup` only spaces its own children.** Anything sitting *beside* a
  group — a validation message, a `DialogFooter`, a submit button — gets its gap
  from `Form`. This is why the gap lives on the form and not on each group.
- **`FieldSet` + `FieldLegend variant="label"`** for related option groups.
- **`Form` defaults to `method="post"`; leave it alone.** Our forms keep their
  state in React and cancel submission in `onSubmit`, but that handler only
  exists after hydration. A submit that lands earlier — blocked script, slow
  load, Enter pressed while a dev build compiles — submits natively, and the
  HTML default of GET copies every named field into the query string. That put
  real passwords in `/login?username=…&password=…`, and so into browser
  history, access logs, and the `Referer` header.

  Override to `method="get"` only for a form whose fields are safe to read off
  a URL *and* whose server route reads them back off `searchParams` — POST
  would move them into the body, where such a route silently ignores them and
  renders as if nothing was submitted. The super-admin directory search
  (`src/components/staff/super-admin-directory.tsx`) is the only such form; it
  pairs the override with hidden scope fields so a pre-hydration submit
  reproduces the current filters.
- **Horizontal rows** (label left, a `Switch` right) use
  `<Field orientation="horizontal">`, with `FieldContent` wrapping the label and
  description when there is a description.

### Divergence from upstream shadcn

`FieldGroup` uses `gap-4`, not upstream's `gap-7` — 7 is tuned for full-page
marketing forms and reads as disconnected in dialogs and settings cards. If you
re-run the shadcn CLI for `field`, re-apply this.

## Numeric inputs

Three purpose-specific primitives wrap the shadcn `Input` —  `MoneyInput`
(`src/components/ui/money-input.tsx`), plus `PercentageInput` and `IntegerInput`
(`src/components/ui/numeric-input.tsx`). All default to
`autoComplete="off"` so browsers do not offer unrelated contact data, and on
each one `className` targets the *complete* control (including the `$` or `%`
adornment) — call sites use it for layout only; inner-input styling stays
private to the primitive.

- **`MoneyInput`** for every currency amount. It bakes in the money defaults
  (`type="number"`, `inputMode="decimal"`, `step="0.01"`,
  `placeholder="0.00"`) plus an integrated leading `$`, so the `$` no longer
  belongs in the label (`Reward`, not `Reward ($)`). It stays purely
  presentational — no parsing, no state — so it drops into `register`,
  controlled string state, and controlled number state alike. Call sites declare
  only what is unique: the `min` floor (`min={0.01}` for amounts that must be
  positive, `min={0}` for settings), an optional `max`, and value/onChange.
- **`PercentageInput`** for percentages: `%` suffix, `0`–`100` default range,
  `0.01` step, decimal keypad. Pass `step={1}` for whole percentages; it then
  requests a digits-only keypad.
- **`IntegerInput`** for counts and whole quantities: type fixed to `number`,
  `step={1}`, digits-only keypad. Call sites still provide domain limits.

Money is **money only** — percentages and other units use their own control.

## Account cards and pickers

Use `AccountBalanceCard` (`src/components/shared/money.tsx`) for every account
balance on a dashboard. Goals are accounts, so `GoalSummaryCard`
(`src/components/shared/goals.tsx`) composes it and only adds the progress bar
plus whatever actions the surface needs via `children`. Never
hand-roll a bordered `div` for a balance — that is what made goals look foreign
next to the accounts beside them.

`size="featured"` scales the balance and icon together. Every card on one
dashboard uses the same size, so the choice belongs to the surface, not the
card.

Account icons follow the account name (`Trip cash 🇪🇺`) on cards and in
name-then-emoji forms, and the emoji is `aria-hidden` — it decorates a name the
screen reader already reads. It is deliberately larger than the label beside it;
the icon is what someone scans for. Pickers are the exception: an option row
leads with the icon, because a list of options is scanned by icon before it is
read. An account without an emoji simply renders without one.

Use `AccountSelect` (same module) everywhere a ledger account is picked —
deposits, expenses, transfers, exchanges, destinations. Every option shows the
same three
things: icon, name, and current balance in its own currency. Someone choosing
where money comes from or goes should never have to leave the dialog to check
what is in an account. Callers pass a `SelectableAccount` that *requires*
`balance` and `currency`, so a picker cannot be wired up without them; select
`emoji` in the same mapping, since accounts own their icon.

New accounts are created with `DEFAULT_ACCOUNT_EMOJI` (`src/lib/ledger.ts`) for
their type. That constant is a creation default, **not a lookup table** — do not
map a type to an icon at render time. `formatAccountOption` stays a plain
string: the select uses it for typeahead and trigger fallback, and tests use it
to describe an option.

## Other shared primitives

- **`SectionHeader`** (`src/components/ui/section-header.tsx`) for repeated
  workspace sections needing a title, optional description, count badge, and
  right-aligned actions. Pair its `id` with the section's `aria-labelledby` so
  the section is a named region.
- **`ResponsiveCreateButton`** (`src/components/ui/responsive-create-button.tsx`)
  for primary create actions: icon-only on small screens, icon plus label on
  desktop.
- **Timezone pickers** all render `TIMEZONE_OPTION_GROUPS`
  (`src/lib/timezones.ts`) — labeled with each zone's current UTC offset, sorted
  west-to-east, with curated choices and human-readable location labels. Render
  groups with `SelectGroup` / `SelectLabel`; never a free-text field or a
  route-specific list.
- **`KidSelectionField`** when a parent chooses which kids can access an item:
  `mode="everyone"` where an empty selection means all kids (job eligibility),
  `mode="selected"` where selected ids are who can see the item (catalog
  availability).

## App shell

Every signed-in role area (parent, kid, relative, super admin) shares one shell:
sticky gnav, content, footer, plus a floating bottom nav pill on mobile. Do not
hand-roll this markup in a layout — compose the primitives from
`src/components/ui/app-shell.tsx`:

- `AppShell` — the `min-h-screen` header/content/footer grid.
- `AppHeader` — the sticky top bar. Children flow left-to-right (brand, badges,
  nav); pass right-aligned actions (usually the user button) via `endSlot`. The
  brand slot varies by role — a logo link for most, a themed greeting for kids.
- `AppContent` — the muted `<main>` with the centered `max-w-6xl` container;
  override width via `className`.
- `MobileNavBar` — the fixed bottom pill shown below `sm`. Put a nav inside and
  give items `flex-1 justify-center`; the pill hides itself when the nav renders
  nothing.

Nav link lists go through `NavLinks` (`src/components/ui/nav-links.tsx`), which
owns active-state detection (`exact` for section roots, prefix otherwise) and
a11y wiring (`aria-current`, labelled `nav`). Per-role navs are thin
item/styling wrappers around it — follow that shape instead of mapping links by
hand.

Layout auth guards live in `src/auth-guards.ts`:

- `requireSession(redirectTo?)` — session-only areas.
- `requireFamilyMember(role, { signedOutRedirect? })` — role-gated areas;
  redirects members of other roles to their own home and family-less users to
  onboarding.
- `privateLayoutMetadata` — shared `robots: noindex` metadata for signed-in
  layouts. Keep `export const dynamic = "force-dynamic"` as a literal in each
  layout (Next.js requires segment config to be statically analyzable).

## Page data loading

Every data-backed RSC page follows one pattern: call `prefetch()` for the page's
tRPC queries, then return the page body inside `PrefetchBoundary`
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

`PrefetchBoundary` dehydrates the per-request QueryClient (including still-pending
prefetches, which stream to the client) and suspends with the fallback. Two rules
keep it correct:

- It belongs in the **page**, after all `prefetch()` calls — layouts and pages
  render in parallel, so a layout-level boundary cannot see queries a page
  prefetches. The one exception is a layout whose own shell consumes prefetched
  data, which gets its own boundary *in addition to* the per-page ones.
- The `fallback` is the page's skeleton, so client-side navigation between pages
  under the same shell shows a content-shaped placeholder.

For the very first document load, `src/app/loading.tsx` renders a branded
splash: the root layout is synchronous, so the splash streams in the first HTML
flush while the auth-guard layouts resolve. Do not add blocking data work to the
root layout — that would delay the splash.

See data-refresh.md for the query-cache side of this pattern.
