import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { authClient, passkey } from "~/auth-client";

import { PasskeysCard } from "./passkeys-card";

const { toastAdd } = vi.hoisted(() => ({ toastAdd: vi.fn() }));

vi.mock("~/auth-client", () => ({
  authClient: { useListPasskeys: vi.fn() },
  passkey: { addPasskey: vi.fn(), deletePasskey: vi.fn() },
}));
vi.mock("~/components/ui/toast", () => ({ toast: { add: toastAdd } }));

const useListPasskeys = vi.mocked(authClient.useListPasskeys);
const addPasskey = vi.mocked(passkey.addPasskey);
const deletePasskey = vi.mocked(passkey.deletePasskey);

function listPasskeys(data: { createdAt?: Date; id: string; name?: string }[]) {
  useListPasskeys.mockReturnValue({ data, isPending: false } as never);
}

describe("PasskeysCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("registers a new passkey", async () => {
    listPasskeys([]);
    addPasskey.mockResolvedValue({ data: {}, error: null } as never);

    render(<PasskeysCard />);
    fireEvent.click(screen.getByRole("button", { name: /add a passkey/i }));

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      ),
    );
    expect(addPasskey).toHaveBeenCalled();
  });

  test("stays quiet when registration is aborted", async () => {
    listPasskeys([]);
    addPasskey.mockResolvedValue({
      data: null,
      error: { code: "ERROR_CEREMONY_ABORTED" },
    } as never);

    render(<PasskeysCard />);
    fireEvent.click(screen.getByRole("button", { name: /add a passkey/i }));

    await waitFor(() => expect(addPasskey).toHaveBeenCalled());
    expect(toastAdd).not.toHaveBeenCalled();
  });

  test("removes the selected passkey after confirmation", async () => {
    listPasskeys([
      { createdAt: new Date("2026-10-01T00:00:00Z"), id: "pk-1", name: "Mac" },
    ]);
    deletePasskey.mockResolvedValue({ data: {}, error: null } as never);

    render(<PasskeysCard />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Mac" }));

    await waitFor(() =>
      expect(deletePasskey).toHaveBeenCalledWith({ id: "pk-1" }),
    );
  });
});
