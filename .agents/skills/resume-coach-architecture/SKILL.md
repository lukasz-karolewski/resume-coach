---
name: resume-coach-architecture
description: Explain the architecture of the resume-coach repository and map changes to the correct layer. Use when working in this repo and you need to understand request flow, app structure, domain boundaries, tRPC router vs `src/server/lib` responsibilities, Better Auth integration, Prisma model ownership, or where new code should live.
---

# Resume Coach Architecture

## Overview

Use this skill to orient yourself in the `resume-coach` codebase before making changes. Treat it as the repo-specific architecture map, grounded in the existing server layering rules from `.github/instructions/trpc.instructions.md`.

## Read First

Read [references/architecture.md](references/architecture.md) before making structural decisions.

Use it to answer:

- Which layer should own a change
- How a page reaches server data
- Where auth, persistence, and agent orchestration connect
- Which files are the canonical entry points for a feature

## Working Rules

Follow these repo conventions:

- Keep App Router files in `src/app` focused on route composition, layout, and page-level data loading.
- Keep reusable UI in `src/components`.
- Keep tRPC routers in `src/server/api/routers` thin. Extract session or IDs, validate inputs, and delegate.
- Keep business logic, schemas, Prisma queries, and domain rules in `src/server/lib`.
- Keep cross-cutting tRPC setup in `src/server/api/trpc.ts` and router aggregation in `src/server/api/root.ts`.
- Keep agent orchestration in `src/server/agent`.
- Keep direct database setup in `src/server/db.ts` and schema ownership in `prisma/schema.prisma`.

## Decision Checklist

When placing new code:

1. Start from the user-facing entry point in `src/app` or `src/components`.
2. Decide whether the feature uses tRPC or a route handler.
3. If it is domain logic, place it in `src/server/lib/[domain].ts`.
4. If it is transport code for typed RPC, place it in `src/server/api/routers/[domain].ts` and call into `lib`.
5. If it is chat or tool-calling orchestration, place it in `src/server/agent`.
6. If it changes persistence, update `prisma/schema.prisma` and the relevant `lib` functions together.

## References

- Repo map and request flows: [references/architecture.md](references/architecture.md)
