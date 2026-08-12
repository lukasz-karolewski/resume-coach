# Server error handling

Server-library errors fall into two categories. Choose the category **at the
point where the rule is enforced** — routers should not recover a plain `Error`
message and forward it later.

`withErrorHandling` (`src/server/utils.ts`) is what enforces the split, so every
procedure goes through it.

## Expected, user-actionable errors

Throw `UserFacingError` (`src/lib/errors`) when a normal request can be refused
for a reason the person can understand and act on: insufficient funds, a
duplicate username, stale approval state, an invalid account combination, a
setting that conflicts with existing data.

`withErrorHandling` converts these to tRPC `BAD_REQUEST`, **preserves their
messages**, and does not log them at error level. That preserved message is what
a dialog renders, so it must:

- follow the voice for its audience (see `product/copy.md`);
- explain the next useful action in plain language;
- use displayed names, never internal enum values such as `MAIN`;
- never include resource IDs, column names, query text, or other implementation
  details.

Tests assert the resulting tRPC code or the behavior that triggered it, not the
exact sentence.

## Protected or unexpected errors

Keep a plain `Error` for:

- not-found and authorization checks, including tenant-scoped lookups, so the
  response does not confirm whether a probed resource ID exists;
- internal invariants, such as a missing required ledger account or an
  unbalanced journal entry;
- infrastructure and database failures.

`withErrorHandling` logs these and replaces their messages with the procedure's
generic `INTERNAL_SERVER_ERROR` fallback.

This lookup policy is deliberately uniform: do not make an individual not-found
message user-facing because one screen usually supplies a valid ID. If a stale
selection needs a recoverable experience, add a separate user-actionable
validation that does not reveal resource existence.
