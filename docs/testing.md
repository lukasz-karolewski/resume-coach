# Testing guidance

Use **Vitest** + **Testing Library** for unit/component tests. Run with
`pnpm test`. Use Playwright (`pnpm test:e2e`) only for browser-level workflows
that unit/component tests cannot cover well.

The guiding rule: **tests assert behavior, not wording.** A test should fail when
the app does the wrong thing, not when someone improves a sentence.

## Require a meaningful regression

Before adding or keeping a test, finish this sentence:

> This test should fail if a user can no longer ...

Good endings describe an outcome: complete an action, see the correct computed
amount, reach the right route, use a control with assistive technology, or stay
within a permission boundary. If the only ending is "see the same classes,"
"see the same markup," or "see this decorative element," the test is probably
not buying us useful confidence.

Use this review order:

1. Identify the user, business, accessibility, or integration contract.
2. Exercise the public component or route boundary that owns that contract.
3. Assert the smallest observable outcome that proves it.
4. Delete a test when no meaningful regression remains after removing
   implementation-detail and copy assertions.

Do not keep a test merely because it already exists or because a component is
shared. A small pass-through wrapper around shadcn or React does not need a
test unless SavvySaver adds behavior of its own.

## `.ts` runs on node, `.tsx` runs in jsdom

`vitest.config.ts` splits the suite into two projects keyed on file extension:

| Extension | Environment | For |
| --- | --- | --- |
| `*.test.ts` | `node` | logic, server, queries, config |
| `*.test.tsx` | `jsdom` | anything that renders |

Building a jsdom costs roughly a second per file and slows every assertion made
inside it, so only rendering tests should pay for one. Importing a heavy
node-side dependency inside jsdom is far worse — `playwright.config.test.ts`
took 11.6s under jsdom and 0.4s under node.

If a `.ts` test needs the DOM, either rename it to `.tsx` or opt in per file:

```ts
// @vitest-environment jsdom
```

Filter to one half with `pnpm test --project node` / `--project jsdom`.

The reverse matters too: a test that does not render or use a DOM-based hook
belongs in `*.test.ts`. Type tests, helpers, modal adapters, and other pure
logic should not pay for jsdom just because the source module is a `.tsx` file.

## Check-first for bug fixes

When fixing a reported bug, write the failing check first:

1. Write a test that reproduces the bug and **confirm it fails** (`pnpm test <file>`).
2. Fix the code.
3. Confirm the test passes.

This proves the test actually guards the behavior you changed.

## Assert behavior, not copy

Pinning full UI sentences makes copy edits fail tests without catching real bugs.
See [copy.md](./copy.md) for why wording changes often.

```ts
// Don't: prose is not the contract.
expect(
  screen.getByText("Moving this back will forfeit $0.20 of accrued interest."),
).toBeInTheDocument();

// Do: assert the values and state that matter.
const dialog = screen.getByRole("dialog");
expect(dialog).toHaveTextContent("$0.20");
expect(dialog).toHaveTextContent("$10.20");
expect(
  within(dialog).getByRole("button", { name: "Move money" }),
).toBeDisabled();
```

What's worth asserting:

- Computed values: money amounts, dates, counts, percentages.
- Control state: disabled/enabled, checked, selected option.
- Rendered branch: the penalty amount appears only when a penalty is due.
- Side effects: mutation payloads, navigation, validation, permissions, and
  accessibility state.

## Avoid decorative assertions

Do not test UI chrome only because it was added, removed, or restyled. A test
like "the transaction type badge is absent" pins a design choice instead of
product behavior, and it can pass while the real workflow is broken.

Assert absence only when it protects a meaningful contract:

- A user must not be able to see or take an action they are not allowed to take.
- A branch must not render because the underlying business condition is false.
- An accessibility state changed, such as an item no longer being announced as
  selected or invalid.

When decorative UI changes, update or delete obsolete tests. If behavior changes
too, test the behavior directly.

## Do not pin styling or DOM placement

Tailwind classes, shadcn `data-slot` attributes, wrapper elements, and sibling
order are implementation details. Assertions such as `toHaveClass("text-xl")`,
`closest("[data-slot='card-title']")`, or `nextElementSibling` usually survive
broken behavior and fail harmless refactors.

Prefer the semantic result:

```tsx
// Don't: tests a styling implementation.
expect(saveButton).toHaveClass("bg-primary", "w-full");

// Do: tests whether the action is available.
expect(
  screen.getByRole("button", { name: "Save changes" }),
).toBeEnabled();
```

DOM order is worth asserting only when order is itself a contract, such as
keyboard focus order or a product requirement that affects comprehension. State
that reason in the test name. Otherwise, assert that the content or action is in
the correct labelled region.

CSS behavior that depends on a viewport, responsive breakpoint, layering,
animation, or actual layout belongs in a targeted Playwright test when the
regression risk justifies it. jsdom cannot prove that it looks correct.

## Loading states

Do not unit test a loading component only by rendering it and finding its own
`data-testid`. That proves little beyond React returning the markup that was
just written.

Loading coverage is useful when it verifies a contract:

- A loading region has an accessible status/name.
- A route or component that suspends exposes its fallback instead of blanking
  stable content.
- Independent sections keep working while one query suspends.

For route fallbacks, test the Suspense boundary that selects the fallback. Do
not duplicate that coverage with one smoke-test file per skeleton, and do not
assert decorative skeleton shape.

## Mock boundaries, not the assertion

Mocks should arrange an observable scenario, not manufacture the exact element
the test then finds. A page test that mocks a child as
`<div data-testid="dashboard" />` can still be valuable when it verifies route
prefetch keys, redirects, or that the child is inside a hydration/Suspense
boundary. Finding the mocked `dashboard` by itself is not sufficient.

Prefer assertions on:

- Inputs passed across the boundary.
- Branch selection, such as a redirect, not-found response, or fallback.
- Mutation payloads and cache invalidation.
- Content or controls rendered by the real subject under test.

## Do not inspect source text

Do not read a source file and search for directives, imports, function names, or
specific syntax. A check such as `readFileSync(...).startsWith('"use client"')`
only pins one implementation and never proves that the module works.

Exercise the module through an import, render, build, or public function instead.
Let TypeScript, Next.js, Biome, and the production build enforce syntax and
module-boundary requirements. If a repository-wide source rule truly needs
enforcement, add a lint rule or validation script with focused tests for the
rule itself.

## Cover branches once

One representative test per logical branch is usually enough. Additional inputs
earn a test when they exercise a boundary, a different branch, a timezone or
currency rule, a security condition, or a past regression.

Changing only the date, label, or fixture while taking the same code path adds
maintenance without much confidence. Prefer a table when several inputs define
one mapping, and delete cases that merely repeat an already-proven path.

Similarly, test shared logic at its owner. A server wrapper that only forwards
to an already-tested money helper does not need to repeat every helper case.
Test the wrapper only when it transforms input, adds policy, or proves an
integration boundary.

## Test fixture invariants, not fixture contents

Seed data, suggestions, catalogs, and other editorial registries change as the
product grows. Do not pin their exact item count, a sample of titles, or a
specific birthday year unless that exact content is a stated requirement.

Assert the durable reason the fixture exists instead:

- A test kid remains within the supported age range.
- Seeded journal entries balance and cover the workflows the demo needs.
- Related records keep valid ownership, availability, and source links.
- Registry identifiers are valid and unique.

A broad "runs without error" test is redundant when stronger tests already
execute the same setup and inspect its results.

## Make server mocks prove a contract

Mocked database calls are useful when they protect tenant scoping, permissions,
filters, pagination, atomic writes, currency balancing, or an intentional
round-trip limit. A test that only repeats a Prisma call assembled by a thin
pass-through function is questionable.

For server failures, follow [errors.md](./errors.md): assert the error category,
tRPC code, privacy boundary, or relevant computed value rather than the exact
sentence. Sentinel messages created inside a test are fine when the point is to
prove that a message is preserved or hidden.

## Query by stable user-facing contracts

Find elements by stable contracts rather than body copy.

- Prefer accessible queries such as `getByRole("button", { name: "Move money" })`,
  `getByRole("dialog")`, and `getByLabelText("Amount")` when the accessible name
  is intentionally stable.
- A short, intentional button/label name is a fine query anchor. A whole
  paragraph of body text is not.
- Use `data-testid` or a stable element `id` when there is no stable role/name.

For form controls, avoid coupling tests to editorial labels. If a field already
has a stable `id`, use it.

```ts
// Don't: breaks when "Reward ($)" becomes "Reward".
fireEvent.change(screen.getByLabelText("Reward ($)"), {
  target: { value: "5.00" },
});

// Do: the id is contract; the label is copy.
fireEvent.change(document.getElementById("job-reward")!, {
  target: { value: "5.00" },
});
```

For number/money fields, `getByRole("spinbutton")` also works when there is only
one on screen.

## Coverage expectations

- Write or update tests for any code you add or change.
- New shared logic (`src/lib`, `src/server/lib`) should have unit tests.
- When you change copy and a test breaks, that's a signal the test was asserting
  the wrong thing. Refactor it to assert behavior rather than re-pinning the new
  string.
