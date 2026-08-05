import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { describe, expect, test, vi } from "vitest";

import type { AppRouter } from "~/server/api/root";

import {
  accomplishmentProfileQuery,
  userInformationQuery,
} from "./profile-queries";

describe("profile queries", () => {
  test("builds the shared profile query options", () => {
    const accomplishmentQueryOptions = vi.fn(() => ({ queryKey: ["roles"] }));
    const userQueryOptions = vi.fn(() => ({ queryKey: ["user"] }));
    const trpc = {
      profile: {
        getAccomplishmentProfile: { queryOptions: accomplishmentQueryOptions },
        getUserInfo: { queryOptions: userQueryOptions },
      },
    } as unknown as TRPCOptionsProxy<AppRouter>;

    expect(accomplishmentProfileQuery(trpc)).toEqual({ queryKey: ["roles"] });
    expect(userInformationQuery(trpc)).toEqual({ queryKey: ["user"] });
    expect(accomplishmentQueryOptions).toHaveBeenCalledWith();
    expect(userQueryOptions).toHaveBeenCalledWith();
  });
});
