import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { authClient, passkey } from "~/auth-client";

import { PasskeysCard } from "./passkeys-card";

const { toastAdd } = vi.hoisted(() => ({ toastAdd: vi.fn() }));

vi.mock("~/auth-client", () => ({
  authClient: { useListPasskeys: vi.fn() },
  passkey: {
    addPasskey: vi.fn(),
    deletePasskey: vi.fn(),
    updatePasskey: vi.fn(),
  },
}));
vi.mock("~/components/ui/toast", () => ({ toast: { add: toastAdd } }));

const useListPasskeys = vi.mocked(authClient.useListPasskeys);
const addPasskey = vi.mocked(passkey.addPasskey);
const deletePasskey = vi.mocked(passkey.deletePasskey);
const updatePasskey = vi.mocked(passkey.updatePasskey);

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

  test("stays quiet when registration is dismissed", async () => {
    listPasskeys([]);
    addPasskey.mockResolvedValue({
      data: null,
      error: { code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY" },
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
    fireEvent.click(screen.getByRole("button", { name: "Remove Mac" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove passkey" }));

    await waitFor(() =>
      expect(deletePasskey).toHaveBeenCalledWith({ id: "pk-1" }),
    );
  });

  test("renames a passkey in place", async () => {
    listPasskeys([{ id: "pk-1", name: "Mac" }]);
    updatePasskey.mockResolvedValue({ data: {}, error: null } as never);

    render(<PasskeysCard />);
    fireEvent.click(screen.getByRole("button", { name: "Rename Mac" }));
    const input = screen.getByRole("textbox", { name: "Passkey name" });
    fireEvent.change(input, { target: { value: "Work laptop" } });
    fireEvent.submit(input);

    await waitFor(() =>
      expect(updatePasskey).toHaveBeenCalledWith({
        id: "pk-1",
        name: "Work laptop",
      }),
    );
  });

  test("swaps the remove action for Save while renaming", () => {
    listPasskeys([
      { createdAt: new Date("2026-10-01T00:00:00Z"), id: "pk-1", name: "Mac" },
    ]);

    render(<PasskeysCard />);
    fireEvent.click(screen.getByRole("button", { name: "Rename Mac" }));

    expect(
      screen.queryByRole("button", { name: "Remove Mac" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("reports a failed rename", async () => {
    listPasskeys([{ id: "pk-1", name: "Mac" }]);
    updatePasskey.mockResolvedValue({
      data: null,
      error: { status: 500 },
    } as never);

    render(<PasskeysCard />);
    fireEvent.click(screen.getByRole("button", { name: "Rename Mac" }));
    const input = screen.getByRole("textbox", { name: "Passkey name" });
    fireEvent.change(input, { target: { value: "Work laptop" } });
    fireEvent.blur(input);

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" }),
      ),
    );
  });

  test("tells the person when this device already has a passkey", async () => {
    listPasskeys([]);
    addPasskey.mockResolvedValue({
      data: null,
      error: { code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED" },
    } as never);

    render(<PasskeysCard />);
    fireEvent.click(screen.getByRole("button", { name: /add a passkey/i }));

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" }),
      ),
    );
  });

  test("does not claim there are no passkeys when the list fails to load", () => {
    useListPasskeys.mockReturnValue({
      data: null,
      error: new Error("offline"),
      isPending: false,
    } as never);

    render(<PasskeysCard />);

    expect(screen.queryByText(/no passkeys yet/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add a passkey/i }),
    ).toBeVisible();
  });
});
