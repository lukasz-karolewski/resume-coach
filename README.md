# Resume Coach - AI Resume Builder

## Package manager

This repository uses `pnpm`.

### Common commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm test:e2e
pnpm lint
pnpm lint:fix
pnpm build
```

### Local PostgreSQL

Start the local database:

```bash
docker compose up -d postgres
```

Use this connection for both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in
`.env.local`:

```text
postgresql://postgres:postgres@localhost:5432/resume_coach
```

Then apply migrations and optionally seed development data:

```bash
pnpm exec prisma migrate deploy
pnpm seed
```

Database backup and restore commands are documented in
`.agents/skills/db-backup-restore/SKILL.md`.

### Playwright

```bash
pnpm exec playwright install --with-deps
pnpm test:e2e
pnpm test:e2e:ui
pnpm exec playwright test --project=chromium
pnpm exec playwright test --debug
pnpm exec playwright codegen
```

## Remote MCP clients

Connect standards-compatible remote MCP clients to:

```text
https://your-resume-coach-host/api/mcp
```

The endpoint advertises its OAuth 2.1/OIDC authorization server through RFC
9728 protected-resource metadata. Clients can register dynamically and use the
authorization-code flow with PKCE. Users sign in through Resume Coach and must
approve the `mcp:tools` scope before the client receives access.

Production deployments must define `BETTER_AUTH_URL` as the public HTTPS origin
and use a high-entropy `BETTER_AUTH_SECRET` of at least 32 characters.

## Notes

TODO:

- print improvements
  - explore https://pagedjs.org/documentation/5-web-design-for-print/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/orphans
  - https://developer.mozilla.org/en-US/docs/Web/CSS/widows

LLM tactics:

- https://webcache.googleusercontent.com/search?q=cache:https://towardsdatascience.com/how-i-won-singapores-gpt-4-prompt-engineering-competition-34c195a93d41
- https://github.com/microsoft/LLMLingua
