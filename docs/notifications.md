# Notifications

A notification is a pointer, not a record. It carries a `title`, an optional
`body`, and an `href`, and nothing else about the event it describes.

## Why they stay generic

Push payloads are built verbatim from the stored row:

```ts
const payload = {
  body: notification.body ?? "",
  tag: notification.dedupeKey,
  title: notification.title,
  url: notification.href,
};
```

So anything written into `title` or `body` can appear on a locked phone. This
is a family finance app used by children, and a figure on a lock screen is
readable by classmates, teachers, or anyone standing nearby. **Never put a
money amount into a notification title, body, or column.**

The `href` deep-links into the authenticated app, which is where amounts
belong. That destination also shows live data, so it cannot go stale the way a
denormalized snapshot does.

`Notification` therefore has no `amount` or `currency` column, and the
notification bell renders no `MoneyAmount`. Activity-level titles that name a
child, a job, or a goal (`Robin finished 🧹 Clean room`) are fine — the money
figure is the sensitive part.

## Structure

`sourceType` plus `sourceId` identify the originating record, but `sourceId` is
a plain string with no relation: it points into one of six tables depending on
`sourceType`. It exists for deduplication and debugging, not for joining, which
is why the display fields are denormalized strings rather than looked up.

`dedupeKey` is unique and drives idempotency — `createManyAndReturn` with
`skipDuplicates` drops rows whose key already exists, and only newly inserted
rows are pushed, so a retry never re-fires a push.
