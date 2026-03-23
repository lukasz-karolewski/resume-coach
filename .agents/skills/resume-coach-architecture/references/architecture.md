# Resume Coach Architecture Reference

## Purpose

This repository is a Next.js 16 App Router application for authenticated resume editing and AI-assisted resume coaching. The major system boundaries are:

- `src/app`: routes, layouts, route handlers, page entry points
- `src/components`: reusable UI and client behavior
- `src/trpc`: client and server-side tRPC callers
- `src/server/api`: tRPC transport layer
- `src/server/lib`: business logic and domain operations
- `src/server/agent`: LLM orchestration for the coaching/chat flow
- `src/server/db.ts` and `prisma/schema.prisma`: persistence setup and schema
- `src/auth.ts`: Better Auth integration

## Top-Level Structure

### App Router

- `src/app/layout.tsx`: root HTML shell, global styles, font setup, and provider injection
- `src/app/(public)`: unauthenticated routes such as login and signup
- `src/app/(auth)`: authenticated app routes such as profile and resume pages
- `src/app/api/auth/[...all]/route.ts`: Better Auth route handler
- `src/app/api/trpc/[trpc]/route.ts`: tRPC HTTP transport
- `src/app/api/chat/route.ts`: authenticated SSE endpoint for the AI coach
- `src/app/api/internal/...`: internal route handlers for background or system integration

### UI Layer

- `src/components/ui`: low-level shared UI primitives
- `src/components/resume`: resume-specific presentation components
- `src/components/chat`: streaming chat UI and hooks
- `src/components/dashboard`: dashboard-specific interactive components
- `src/components/providers.tsx`: client-side provider composition

### Server Layer

- `src/server/api/trpc.ts`: tRPC initialization, context creation, error formatting, auth middleware
- `src/server/api/root.ts`: domain router registration
- `src/server/api/routers/*.ts`: thin RPC routers
- `src/server/lib/*.ts`: schemas and business logic
- `src/server/agent/*.ts`: LangChain/LangGraph agent graph, prompts, and tools
- `src/server/db.ts`: Prisma client creation with the Postgres adapter

### Shared Type and Infra Layer

- `src/trpc/react.tsx`: client-side React Query and tRPC provider
- `src/trpc/server.ts`: server-side local tRPC client for RSC usage
- `src/trpc/shared.ts`: shared transformer and URL helpers
- `src/env.js`: environment validation
- `src/generated/prisma`: generated Prisma client; do not hand-edit

## Architectural Patterns

### 1. App Router shell with providers at the root

`src/app/layout.tsx` is the global composition point. It injects:

- `TRPCReactProvider` for client components that call tRPC
- `NiceModalProviderWrapper` for modal orchestration
- global styles from `src/app/styles.css`

Implication:

- Global providers belong in the root layout, not scattered per page.
- Route groups under `(public)` and `(auth)` should focus on route-specific structure.

### 2. Thin controller / fat service on the server

The repo already documents this pattern in `.github/instructions/trpc.instructions.md`, and the server tree reflects it:

- `src/server/api/routers/*.ts` owns transport concerns
- `src/server/lib/*.ts` owns domain logic

#### Router responsibilities

Keep routers thin:

- define `publicProcedure` or `protectedProcedure`
- accept input schemas
- extract authenticated user context
- call functions from `src/server/lib`
- keep transport-specific error handling at the edge

Do not place business rules, data shaping, or multi-step Prisma workflows in routers.

#### Lib responsibilities

Keep `src/server/lib/*.ts` as the domain layer:

- export Zod schemas used by callers
- run Prisma queries and transactions
- enforce business rules
- own transformations from input to persistence shape
- remain independent of tRPC transport details

This boundary is the main placement rule for server changes.

### 3. Auth is centralized through Better Auth

`src/auth.ts` configures Better Auth with:

- Prisma adapter backed by the app database
- optional Google social login
- email/password auth
- Next.js cookie integration

Auth is then consumed in two primary ways:

- `src/server/api/trpc.ts` resolves the session while building tRPC context
- `src/app/api/chat/route.ts` authenticates before opening the SSE stream

Implication:

- Session lookups should reuse Better Auth rather than rolling custom cookie parsing.
- User ownership checks still belong in domain logic and queries, even after router auth passes.

### 4. Two server access paths: typed RPC and route handlers

This codebase uses both:

- tRPC for typed app-domain operations
- Next route handlers for protocol-specific endpoints like auth and chat streaming

Use tRPC when:

- the feature is a typed query or mutation used by the app UI
- React Query caching and typed client calls are useful

Use a route handler when:

- the endpoint needs custom HTTP semantics
- the response is a stream, webhook, or non-tRPC protocol

Example:

- `src/app/api/chat/route.ts` is a route handler because it owns SSE mechanics and streams agent events.

### 5. Agent flow is separate from CRUD-style business logic

`src/server/agent` is its own subsystem:

- `graph.ts` creates and runs the agent
- `prompt.ts` provides prompt middleware
- `tools.ts` exposes tool functions to the agent

`executeChatStream()` in `graph.ts`:

- looks up or creates a `ChatThread`
- configures agent context with `userId` and current resume
- streams model and tool events back through SSE

Implication:

- Put chat orchestration, event streaming, tool wiring, and LLM state in `src/server/agent`.
- Put ordinary resume or job domain operations in `src/server/lib`, even if the agent later calls them.

### 6. Persistence centers on Prisma schema ownership

`prisma/schema.prisma` defines two broad groups:

- Better Auth tables and relations: `User`, `Session`, `Account`, `Verification`
- App models: `Job`, `Resume`, `Experience`, `Position`, `Education`, `Skill`, `ChatThread`, and related join tables

`src/server/db.ts` creates the Prisma client with `@prisma/adapter-pg` and reuses a global instance in development.

Implication:

- Schema changes start in Prisma, then flow into generated client types and `src/server/lib`.
- Treat `src/generated/prisma` as generated output only.

## Canonical Request Flows

### Authenticated page using tRPC

1. A page under `src/app/(auth)` renders.
2. Shared providers from `src/app/layout.tsx` make the tRPC React client available.
3. Client components call procedures through `src/trpc/react.tsx`, or server code can call through `src/trpc/server.ts`.
4. `src/server/api/trpc.ts` builds context with `db` and `session`.
5. The matching router in `src/server/api/routers` validates and delegates.
6. The domain function in `src/server/lib` runs Prisma work and returns data.

### Chat request

1. The client posts to `src/app/api/chat/route.ts`.
2. The route authenticates with Better Auth.
3. The route opens an SSE stream and calls `executeChatStream()`.
4. `src/server/agent/graph.ts` creates or resumes agent state and streams events.
5. Tool and model events are forwarded to the client as SSE messages.

## File Placement Guide

Place code by responsibility:

- New page or route segment: `src/app/...`
- Reusable visual component: `src/components/...`
- tRPC router or procedure: `src/server/api/routers/...`
- Domain logic, validation, Prisma access: `src/server/lib/...`
- Agent prompts, tools, orchestration: `src/server/agent/...`
- Auth setup: `src/auth.ts`
- DB client setup: `src/server/db.ts`
- Schema or model changes: `prisma/schema.prisma`
- Generated Prisma output: never edit `src/generated/prisma/...` manually

## Change Heuristics

Use these heuristics before editing:

- If code depends on `ctx.session`, `protectedProcedure`, or transport inputs, start in the router.
- If code would still make sense from a CLI job or background worker, it belongs in `src/server/lib`.
- If code manages streaming, prompt construction, checkpoints, or tool invocation, it belongs in `src/server/agent`.
- If code is mainly presentational or interactive UI, keep it in `src/components`.
- If a change touches data shape or relations, inspect `prisma/schema.prisma` first.

## Current Domain Areas

The main domain slices visible in the codebase are:

- `job`: job ingestion and job-related persistence
- `profile`: user profile management
- `resume`: resume CRUD and resume content editing
- `chat` and `agent`: AI coaching and streaming interaction

Prefer extending an existing slice before creating a new one unless the new domain has distinct ownership and data flow.
