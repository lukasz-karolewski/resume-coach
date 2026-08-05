# Server error handling

Server-library errors fall into two categories. Choose the category at the
point where the rule is enforced; routers should not recover a plain `Error`
message and forward it later.

## Expected, user-actionable errors

Throw `UserFacingError` from `~/lib/errors` when a normal request can be refused
for a reason the person can understand and act on. Examples include insufficient
funds, duplicate usernames, stale approval state, invalid account combinations,
and a setting that conflicts with existing data.

`withErrorHandling` converts these errors to tRPC `BAD_REQUEST` responses,
preserves their messages, and does not log them at error level.

Messages must:

- follow the kid or parent voice in [copy.md](./copy.md);
- explain the next useful action in plain language;
- use displayed account names where they are available, never internal enum
  names such as `MAIN`;
- never include resource IDs, database column names, query text, or other
  implementation details.

Tests should assert the resulting tRPC code or the behavior that triggered it,
not the exact sentence.

## Protected or unexpected errors

Keep a plain `Error` for:

- not-found and authorization checks, including family-scoped lookups, so the
  response does not confirm whether a probed resource ID exists;
- internal invariants such as missing required ledger accounts or an unbalanced
  journal entry;
- infrastructure and database failures.

`withErrorHandling` logs these errors and replaces their messages with the
procedure's generic `INTERNAL_SERVER_ERROR` fallback.

This lookup policy is deliberately consistent: do not make individual
not-found messages user-facing because a particular screen usually supplies a
valid ID. If a stale selection needs a recoverable experience, introduce a
separate user-actionable validation that does not reveal resource existence.
