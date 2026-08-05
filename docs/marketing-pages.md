# Marketing pages

The public, indexable content experience lives in the `(marketing)` route
group:

```text
src/app/(marketing)/
  layout.tsx
  page.tsx
  blog/
    page.tsx
    [slug]/
      page.tsx
  privacy/
    page.tsx
  terms/
    page.tsx
```

Next.js route groups do not contribute a URL segment, so these files still
serve `/`, `/blog`, `/blog/[slug]`, `/privacy`, and `/terms`.

## Shell ownership

`src/app/(marketing)/layout.tsx` is the single owner of the full-page marketing
frame:

- the `min-h-screen` background and foreground wrapper;
- `MarketingNav`; and
- `MarketingFooter`.

Pages inside the group render their own semantic `<main>` content. They must not
import or render `MarketingNav`, `MarketingFooter`, or another full-page
marketing wrapper. Put new indexable marketing pages under `(marketing)` so
they inherit this shell automatically.

Unauthenticated application flows such as `/login`, `/signup`, and
`/accept-invite` belong to `(public)`, not `(marketing)`. They use the
authentication-flow layout and remain excluded from search with page-level
`noindex` metadata.

## Static rendering

`MarketingNav` is intentionally session-free and synchronous. This avoids
request-time `headers()` and session resolution in the shared shell, so every
marketing route prerenders:

- `/`, `/blog`, `/privacy`, and `/terms` are static; and
- `/blog/[slug]` is generated from `generateStaticParams`.

Do not add request-time APIs such as `headers()` or `cookies()` to the shared
layout or to `page.tsx`. If a content route needs request-specific behavior,
isolate it to that route and verify the production build output does not make
unrelated marketing pages dynamic.

## Signed-in visitors

`proxy.ts` matches `/` and redirects a signed-in visitor to their dashboard
before rendering starts. The home page itself does no session work.

This has to happen in the proxy. A `redirect()` thrown from the page body runs
after the session `await`, by which point Next has already flushed the shared
shell, so the visitor sees `MarketingNav` and `MarketingFooter` flash before the
client-side redirect completes. Keeping the check in the proxy also leaves `/`
prerenderable.

Any new marketing route that needs to bounce signed-in visitors belongs in the
proxy for the same two reasons, and takes **two** edits:

1. add it to `SIGNED_OUT_ENTRY_PATHS` in `src/lib/auth-routing.ts`; and
2. mirror the literal in the `proxy.ts` matcher — Next.js only static-analyzes
   constant matcher values, so the matcher cannot derive from the list.

Both are required. A matched path missing from `SIGNED_OUT_ENTRY_PATHS` is
treated as protected, so the proxy would send anonymous visitors and crawlers to
`/login`. `proxy.test.ts` asserts every entry path reaches the matcher.

## Metadata

Use `buildPageMetadata` from `src/app/site-config.ts` for canonical, Open Graph,
and Twitter metadata. The helper derives URL fields from the route path and
relies on the root `metadataBase` to resolve them.

Blog registry data in `src/lib/blog.ts` drives post metadata, static params, and
sitemap entries. See `.agents/skills/marketing-blog/SKILL.md` for the complete
post-authoring workflow.

## Tests

- Keep route-specific behavior tests next to their pages under `(marketing)`.
- Keep shared layout behavior in
  `src/app/(marketing)/layout.test.tsx`.
- Run `pnpm lint:fix`, `pnpm test`, and `pnpm build` after changing shared
  marketing routing or rendering behavior.
