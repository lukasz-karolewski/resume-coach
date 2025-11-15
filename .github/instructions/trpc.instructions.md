---
applyTo: "src/server/api/**/*.ts"
---

# Server-Side Code Organization Pattern: API Routes vs. Business Logic (lib)

## Architecture Overview
A **thin controller / fat service** pattern with strict separation of concerns between API layer and business logic layer.

## Directory Structure
```
src/server/
├── api/
│   ├── routers/           # tRPC route handlers (thin controllers)
│   │   ├── scenarios.ts
│   │   ├── projects.ts
│   │   └── property.ts
│   ├── root.ts            # Router aggregation
│   └── trpc.ts            # tRPC setup & middleware
└── lib/                   # Business logic (fat services)
    ├── scenario.ts
    ├── project.ts
    ├── property.ts
    └── calculator.ts
```

## Responsibilities by Layer

### **API Routers (`src/server/api/routers/*.ts`)** - Thin Controllers
These files are **presentation/transport layer only** and should:

1. **Start with `"server-only"` directive** to prevent client-side imports, no not use `"use server"` it's for React Server Components
2. **Define tRPC procedures** (queries/mutations) with appropriate middleware
3. **Extract context** (session, db, userId) from tRPC context
4. **Delegate to business logic** - call functions from `lib/` with minimal processing
5. **Handle errors generically** - wrap calls in error handlers like `withErrorHandling()`
6. **Import Zod schemas** from lib for input validation
7. **NOT contain any business logic** - no calculations, no data transformations, no complex queries

**Pattern:**
```typescript
import "server-only";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { functionFromLib, schemaFromLib } from "~/server/lib/domain";
import { withErrorHandling } from "~/server/utils";

export const domainRouter = createTRPCRouter({
  someAction: protectedProcedure
    .input(schemaFromLib)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => functionFromLib(ctx.db, userId, input),
        "Failed to perform action"
      );
    }),
});
```

### **Business Logic (`src/server/lib/*.ts`)** - Fat Services
These files contain **all business logic** and should:

1. **Start with `"server-only"` directive**
2. **Export Zod validation schemas** for inputs/outputs used by API routers
3. **Export pure business functions** that accept explicit parameters (db, userId, inputs)
4. **Contain all domain logic**:
   - Database queries (Prisma operations)
   - Data transformations
   - Business rules and validations
   - Calculations
   - Permission checks
   - Complex query building
5. **Be framework-agnostic** - no knowledge of tRPC, HTTP, or request/response
6. **Be testable** - can be unit tested without mocking the entire API layer
7. **Use transactions when needed** - `db.$transaction()` for multi-step operations
8. **Return domain objects** - not HTTP responses

**Pattern:**
```typescript
import "server-only";
import { z } from "zod";
import type { PrismaClient } from "~/generated/prisma/client";

// Export schemas for API routers to use
export const createItemSchema = z.object({
  name: z.string().min(1),
  // ... other fields
});

// Export business functions
export async function createItem(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof createItemSchema>
) {
  // Business logic, validations, database operations
  return db.item.create({ ... });
}
```

## Key Design Principles

1. **Separation of Concerns**: API routers handle HTTP/tRPC concerns; lib handles business logic
2. **Testability**: Business logic in lib can be tested independently of API framework
3. **Reusability**: Functions in lib can be called from multiple API endpoints or background jobs
4. **Single Responsibility**: Each layer has one reason to change
5. **Dependency Direction**: API depends on lib, never the reverse
6. **Type Safety**: Schemas defined once in lib, used by both API validation and TypeScript types
7. **Framework Independence**: Business logic doesn't know about tRPC, making migration easier

## Benefits

- **Easier testing**: Test business logic without HTTP/tRPC mocking
- **Clearer code reviews**: API changes vs. business logic changes are in separate files
- **Better reusability**: Business functions can be called from CLI, cron jobs, or other APIs
- **Simplified debugging**: Business logic isolated from framework concerns
- **Team scaling**: Junior devs can work on API routers, senior devs on complex business logic
- **Migration flexibility**: Can swap tRPC for REST without touching business logic

## Anti-Patterns to Avoid

❌ **DON'T**: Put business logic in API routers
❌ **DON'T**: Import tRPC context types into lib files
❌ **DON'T**: Make lib functions aware of HTTP/session/cookies
❌ **DON'T**: Duplicate schemas between API and lib
❌ **DON'T**: Skip the lib layer and put everything in routers

✅ **DO**: Keep routers thin - just extract context and delegate
✅ **DO**: Keep lib focused on business rules and data operations
✅ **DO**: Export schemas from lib for reuse in routers
✅ **DO**: Make lib functions pure and testable
✅ **DO**: Use explicit parameters (db, userId) instead of implicit context

## Implementation Checklist

When adding a new feature:

- [ ] Define Zod schemas in `src/server/lib/[domain].ts`
- [ ] Implement business logic functions in `src/server/lib/[domain].ts`
- [ ] Write unit tests for business logic in `src/server/lib/[domain].test.ts`
- [ ] Create thin API router in `src/server/api/routers/[domain].ts`
- [ ] Import schemas and functions from lib into router
- [ ] Use `protectedProcedure` or `publicProcedure` as appropriate
- [ ] Wrap business function calls with `withErrorHandling()`
- [ ] Register router in `src/server/api/root.ts`
- [ ] Verify both files start with `"server-only"` directive

---

This pattern provides a clean, maintainable architecture that scales well as your application grows.
