# Testing guidance

Vitest + Testing Library for unit and component tests (`pnpm test`). Playwright
(`pnpm test:e2e`) only for browser-level workflows those cannot cover.

The guiding rule: **tests assert behavior, not wording.** A test should fail when
the app does the wrong thing, not when someone improves a sentence.

## Require a meaningful regression

Before adding or keeping a test, finish this sentence:

> This test should fail if a user can no longer ...

Good endings describe an outcome: complete an action, see the correct computed
amount, reach the right route, use a control with assistive technology, or stay
within a permission boundary. If the only ending is "see the same classes,"
"see the same markup," or "see this decorative element," the test is not buying
useful confidence.

Review order:

1. Identify the user, business, accessibility, or integration contract.
2. Exercise the public component or route boundary that owns that contract.
3. Assert the smallest observable outcome that proves it.
4. Delete the test when no meaningful regression remains after removing
   implementation-detail and copy assertions.

Do not keep a test merely because it already exists or because a component is
shared. A thin pass-through wrapper around a design-system or framework
component does not need a test unless the app adds behavior of its own.

## `.ts` runs on node, `.tsx` runs in jsdom

`vitest.config.ts` splits the suite into two projects keyed on file extension:

| Extension | Environment | For |
| --- | --- | --- |
| `*.test.ts` | `node` | logic, server, queries, config |
| `*.test.tsx` | `jsdom` | anything that renders |

Building a jsdom costs roughly a second per file and slows every assertion made
inside it, so only rendering tests should pay for one. Importing a heavy
node-side dependency inside jsdom is far worse — one config test took 11.6s
under jsdom and 0.4s under node.

If a `.ts` test needs the DOM, rename it to `.tsx` or opt in per file with
`// @vitest-environment jsdom`. Filter to one half with
`pnpm test --project node` / `--project jsdom`.

The reverse matters too: type tests, helpers, adapters, and other pure logic
belong in `*.test.ts` even when the source module is a `.tsx` file.

## Check-first for bug fixes

1. Write a test that reproduces the bug and **confirm it fails**.
2. Fix the code.
3. Confirm the test passes.

This proves the test actually guards the behavior you changed.

## Assert behavior, not copy

Pinning full UI sentences makes copy edits fail tests without catching real
bugs, and wording changes often.

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

## Do not assert implementation

These are one rule at four altitudes: an assertion that survives broken behavior
and fails harmless refactors is not worth its maintenance.

- **Decorative chrome.** Do not test UI that was added, removed, or restyled. A
  test like "the type badge is absent" pins a design choice and can pass while
  the real workflow is broken. Assert absence only when it protects a contract:
  a user must not see or take an action they are not allowed to; a branch must
  not render because the business condition is false; or an accessibility state
  changed, such as an item no longer being announced as selected or invalid.
- **Styling and DOM placement.** Utility classes, design-system `data-slot`
  attributes, wrapper elements, and sibling order are implementation details.
  Prefer the semantic result — `expect(saveButton).toBeEnabled()` over
  `expect(saveButton).toHaveClass("bg-primary")`. DOM order is worth asserting
  only when order is itself a contract (keyboard focus order, a comprehension
  requirement); state that reason in the test name. Otherwise assert that the
  content is in the correct labelled region.
- **Mocks that manufacture the assertion.** Mocks should arrange an observable
  scenario, not produce the exact element the test then finds. A page test that
  stubs a child as `<div data-testid="dashboard" />` is valuable when it verifies
  prefetch keys, redirects, or that the child sits inside a Suspense boundary —
  finding the stub itself proves nothing. Assert inputs passed across the
  boundary, branch selection, mutation payloads and cache invalidation, or
  content rendered by the real subject.
- **Source text.** Never read a source file and search for directives, imports,
  or syntax; `readFileSync(...).startsWith('"use client"')` pins one
  implementation and never proves the module works. Exercise the module through
  an import, render, or build and let TypeScript, the linter, and the production
  build enforce syntax. A repository-wide source rule belongs in a lint rule,
  with focused tests for the rule itself.

CSS behavior that depends on viewport, breakpoint, layering, animation, or real
layout belongs in a targeted browser test when the regression risk justifies it.
jsdom cannot prove that it looks correct.

## Loading states

Rendering a loading component and finding its own `data-testid` proves little
beyond React returning the markup that was just written. Loading coverage is
useful when it verifies a contract:

- A loading region has an accessible status/name.
- A route or component that suspends exposes its fallback instead of blanking
  stable content.
- Independent sections keep working while one query suspends.

Test the Suspense boundary that selects the fallback. Do not duplicate that with
one smoke test per skeleton, and do not assert skeleton shape.

## Cover branches once

One representative test per logical branch is usually enough. Additional inputs
earn a test when they exercise a boundary, a different branch, a timezone or
currency rule, a security condition, or a past regression. Changing only the
date, label, or fixture while taking the same code path adds maintenance without
confidence. Prefer a table when several inputs define one mapping.

Test shared logic at its owner. A server wrapper that only forwards to an
already-tested helper does not need to repeat every helper case — test it when
it transforms input, adds policy, or proves an integration boundary.

## Test fixture invariants, not fixture contents

Seed data, suggestions, catalogs, and other editorial registries change as the
product grows. Do not pin their exact item count, a sample of titles, or a
specific date unless that content is a stated requirement. Assert the durable
reason the fixture exists instead:

- A test user remains within the supported range for their scenario.
- Seeded ledger entries balance and cover the workflows the demo needs.
- Related records keep valid ownership, availability, and source links.
- Registry identifiers are valid and unique.

A broad "runs without error" test is redundant when stronger tests already
execute the same setup and inspect its results.

## Make server mocks prove a contract

Mocked database calls are useful when they protect tenant scoping, permissions,
filters, pagination, atomic writes, or an intentional round-trip limit. A test
that only repeats a query assembled by a thin pass-through function is
questionable.

For server failures, assert the error category, error code, privacy boundary, or
computed value rather than the exact sentence. Sentinel messages created inside
a test are fine when the point is to prove that a message is preserved or hidden.

## Query by stable user-facing contracts

Find elements by stable contracts rather than body copy.

- Prefer accessible queries such as `getByRole("button", { name: "Move money" })`,
  `getByRole("dialog")`, and `getByLabelText("Amount")` when the accessible name
  is intentionally stable.
- A short, intentional button or label name is a fine query anchor. A whole
  paragraph of body text is not.
- Use `data-testid` or a stable element `id` when there is no stable role/name.

For form controls, avoid coupling tests to editorial labels:

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

For number and money fields, `getByRole("spinbutton")` also works when there is
only one on screen.

## Coverage expectations

- Write or update tests for any code you add or change.
- New shared logic (`src/lib`, `src/server/lib`) should have unit tests.
- When you change copy and a test breaks, that's a signal the test was asserting
  the wrong thing. Refactor it to assert behavior rather than re-pinning the new
  string.
