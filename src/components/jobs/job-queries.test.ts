import { describe, expect, test, vi } from "vitest";

import { jobListQuery, resumesForJobQuery } from "./job-queries";

describe("job query options", () => {
  test("uses stable inputs for page prefetching and client hydration", () => {
    const trpc = {
      job: {
        getJobs: { queryOptions: vi.fn(() => ({ queryKey: ["jobs"] })) },
      },
      resume: {
        list: {
          queryOptions: vi.fn((input) => ({ input, queryKey: ["resumes"] })),
        },
      },
    };

    expect(jobListQuery(trpc as never)).toEqual({ queryKey: ["jobs"] });
    expect(resumesForJobQuery(trpc as never)).toEqual({
      input: { sort: "last-updated" },
      queryKey: ["resumes"],
    });
  });
});
