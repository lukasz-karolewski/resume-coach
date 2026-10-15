import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { describe, expect, test } from "vitest";

import type { AppRouter } from "~/server/api/root";

import { resumeDetailQuery, resumeListQuery } from "./resume-queries";

const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient<AppRouter>({ links: [] }),
  queryClient: new QueryClient(),
});

describe("resume queries", () => {
  test("caches each resume and each list sort under its own procedure key", () => {
    expect(resumeDetailQuery(trpc, "Res007").queryKey).toEqual(
      trpc.resume.getById.queryKey({ id: "Res007" }),
    );
    expect(resumeListQuery(trpc, "name").queryKey).toEqual(
      trpc.resume.list.queryKey({ sort: "name" }),
    );
    expect(resumeListQuery(trpc, "name").queryKey).not.toEqual(
      resumeListQuery(trpc, "last-updated").queryKey,
    );
  });
});
