import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { describe, expect, test } from "vitest";

import type { AppRouter } from "~/server/api/root";

import { resumesForJobQuery } from "./job-queries";

const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient<AppRouter>({ links: [] }),
  queryClient: new QueryClient(),
});

describe("job query options", () => {
  test("offers resumes most recently updated first in the job picker", () => {
    expect(resumesForJobQuery(trpc).queryKey).toEqual(
      trpc.resume.list.queryKey({ sort: "last-updated" }),
    );
  });
});
