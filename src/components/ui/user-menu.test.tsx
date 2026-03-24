import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UserMenu } from "./user-menu";

const { push, signOut } = vi.hoisted(() => ({
  push: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push,
  })),
}));

vi.mock("~/auth-client", () => ({
  signOut,
}));

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("signs the user out from the avatar dropdown using Better Auth", async () => {
    signOut.mockImplementation(
      async (options?: { fetchOptions?: { onSuccess?: () => void } }) => {
        options?.fetchOptions?.onSuccess?.();

        return { data: null, error: null };
      },
    );

    render(<UserMenu email="jane@example.com" initials="JD" name="Jane Doe" />);

    fireEvent.pointerDown(screen.getByRole("button"), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByText("Sign Out"));

    expect(signOut).toHaveBeenCalledWith({
      fetchOptions: {
        onSuccess: expect.any(Function),
      },
    });
    expect(push).toHaveBeenCalledWith("/login");
  });
});
