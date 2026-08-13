---
name: db-backup-restore
description: >
  Back up and restore resume-coach PostgreSQL databases. Use for local Docker
  database setup or wipes, production Neon backups, production-to-local
  restores, pg_dump, pg_restore, Prisma reset safety, and preserving data
  before destructive database work.
---

# DB Backup & Restore

Run all commands from the resume-coach workspace root. Prefer the repository
scripts over ad hoc `pg_dump`, `pg_restore`, or schema deletion commands.

## Targets

| Target | Database | Script argument |
|---|---|---|
| Local Docker | `postgresql://postgres:postgres@localhost:5432/resume_coach` | `local` |
| Production Neon | project `fragrant-unit-64753227`, database `neondb` | `prod` |

The Compose service is `postgres`; start it with:

```bash
docker compose up -d postgres
```

For local application development, set both `DATABASE_URL` and
`DATABASE_URL_UNPOOLED` in the ignored `.env.local` to the local URL above.
Do not treat `.env.local` as a production credential source.

## Back Up

```bash
./bin/dev/db-backup.sh local
./bin/dev/db-backup.sh prod
./bin/dev/db-backup.sh prod backup/prod.dump
```

Default filenames are
`backup/resume-coach-<local|prod>-YYYYMMDD-HHMMSS.dump`. The ignored `backup/`
directory is created automatically.

The script creates a PostgreSQL custom-format dump of `public` with
`pg_dump --schema=public --no-owner --no-acl -Fc`. It uses the Compose
container's PostgreSQL tools and redacts passwords in output.

Resolve production credentials in this order:

1. `PROD_DATABASE_URL_UNPOOLED`
2. `DATABASE_URL_UNPOOLED` in `.env.production.local`
3. `neonctl connection-string main` for the configured project

## Restore

Restore replaces the target database contents and is destructive:

```bash
DB_RESTORE_CONFIRM="restore local" \
  ./bin/dev/db-restore.sh local backup/prod.dump

DB_RESTORE_CONFIRM="restore prod" \
  ./bin/dev/db-restore.sh prod backup/prod.dump
```

Without `DB_RESTORE_CONFIRM`, type `restore local` or `restore prod` at the
prompt. The script accepts only custom-format dumps produced by the backup
script.

- Local: drop and recreate the `resume_coach` database.
- Production: drop and recreate only `public`; do not modify Neon-managed
  schemas.
- Restore with `--exit-on-error --clean --if-exists --no-owner --no-acl
  --no-comments`.
- Verify counts for users, resumes, jobs, sessions, and chat threads afterward.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `DB_DOCKER_SERVICE` | `postgres` | Compose service containing PostgreSQL tools |
| `LOCAL_DATABASE_URL` | local `resume_coach` URL | Local backup/restore target |
| `LOCAL_ADMIN_URL` | local `postgres` database URL | Local drop/create connection |
| `PROD_ENV_FILE` | `.env.production.local` | Production URL source |
| `PROD_DATABASE_URL_UNPOOLED` | unset | Explicit production URL override |
| `NEON_PROJECT_ID` | `fragrant-unit-64753227` | Production Neon project |
| `NEON_ROLE_NAME` | `neondb_owner` | Neon role |
| `NEON_DATABASE_NAME` | `neondb` | Neon database |

## Safety Rules

- Back up before destructive database work.
- Never print or paste production connection strings.
- Never source production credentials from `.env.local` automatically.
- Require the exact restore confirmation phrase; do not bypass it implicitly.
- Preserve Neon-managed schemas by limiting backups and restores to `public`.
- For a Prisma reset performed by an agent, pass the user's exact consent:

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<exact user message>" \
  pnpm exec prisma migrate reset --force
```

After restoring production data locally, apply any newer migrations with
`pnpm exec prisma migrate deploy` and regenerate the client with
`pnpm exec prisma generate` when the Prisma schema changed.
