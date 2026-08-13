import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { describe, expect, test, vi } from "vitest";

import type { AppRouter } from "~/server/api/root";

import { resumeDetailQuery, resumeListQuery } from "./resume-queries";

describe("resume queries", () => {
  test("uses identical list and detail inputs for prefetch and consumption", () => {
    const detailQueryOptions = vi.fn((input) => ({ input }));
    const listQueryOptions = vi.fn((input) => ({ input }));
    const trpc = {
      resume: {
        getById: { queryOptions: detailQueryOptions },
        list: { queryOptions: listQueryOptions },
      },
    } as unknown as TRPCOptionsProxy<AppRouter>;

    expect(resumeDetailQuery(trpc, "Res007")).toEqual({
      input: { id: "Res007" },
    });
    expect(resumeListQuery(trpc, "name")).toEqual({
      input: { sort: "name" },
    });
    expect(detailQueryOptions).toHaveBeenCalledWith({ id: "Res007" });
    expect(listQueryOptions).toHaveBeenCalledWith({ sort: "name" });
  });
});
