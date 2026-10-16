import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signIn } from "~/auth-client";
import LoginPage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock auth-client
vi.mock("~/auth-client", () => ({
  signIn: {
    email: vi.fn(),
    passkey: vi.fn(),
    social: vi.fn(),
  },
}));

const { restartAutofill } = vi.hoisted(() => ({ restartAutofill: vi.fn() }));
vi.mock("~/components/auth/use-passkey-autofill", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("~/components/auth/use-passkey-autofill")
  >()),
  usePasskeyAutofill: () => ({ restart: restartAutofill }),
}));

describe("LoginPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/login");
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
  });

  it("lets Better Auth continue an OAuth authorization after login", async () => {
    window.history.replaceState(
      {},
      "",
      "/login?client_id=mcp-client&sig=signed-request",
    );
    const mockEmailSignIn = signIn.email as ReturnType<typeof vi.fn>;
    mockEmailSignIn.mockImplementation((_credentials, { onSuccess }) => {
      onSuccess?.();
      return Promise.resolve();
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in$/i }));

    await waitFor(() => {
      expect(mockEmailSignIn).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("handles successful email login", async () => {
    const mockEmailSignIn = signIn.email as ReturnType<typeof vi.fn>;
    mockEmailSignIn.mockImplementation((_credentials, { onSuccess }) => {
      onSuccess?.();
      return Promise.resolve();
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockEmailSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          password: "password123",
        }),
        expect.any(Object),
      );
      expect(mockPush).toHaveBeenCalledWith("/jobs");
    });
  });

  it("links visitors without an account to signup", () => {
    render(<LoginPage />);

    expect(
      screen
        .getAllByRole("link")
        .some((link) => link.getAttribute("href") === "/signup"),
    ).toBe(true);
  });

  it("replaces a credential error with a classified alert", async () => {
    const mockEmailSignIn = signIn.email as ReturnType<typeof vi.fn>;
    mockEmailSignIn.mockImplementation((_credentials, { onError }) => {
      onError?.({ error: { message: "Invalid credentials" } });
      return Promise.resolve();
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows loading state during sign in", async () => {
    const mockEmailSignIn = signIn.email as ReturnType<typeof vi.fn>;
    mockEmailSignIn.mockImplementation((_credentials, { onRequest }) => {
      onRequest?.();
      return new Promise(() => {}); // Never resolves to keep loading state
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /signing in.../i }),
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it("handles Google sign in", async () => {
    const mockSocialSignIn = signIn.social as ReturnType<typeof vi.fn>;

    render(<LoginPage />);

    const googleButton = screen.getByRole("button", {
      name: /continue with google/i,
    });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSocialSignIn).toHaveBeenCalledWith({
        callbackURL: "/jobs",
        provider: "google",
      });
    });
  });

  it("marks the email field for passkey autofill", () => {
    render(<LoginPage />);

    expect(
      screen.getByLabelText(/email/i).getAttribute("autocomplete")?.split(" "),
    ).toEqual(["username", "webauthn"]);
  });

  it("signs in with the passkey button", async () => {
    const mockPasskeySignIn = signIn.passkey as ReturnType<typeof vi.fn>;
    mockPasskeySignIn.mockResolvedValue({ data: { session: {} }, error: null });

    render(<LoginPage />);
    fireEvent.click(
      screen.getByRole("button", { name: /sign in with passkey/i }),
    );

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/jobs"));
    expect(mockPasskeySignIn).toHaveBeenCalledWith();
  });

  it("keeps password sign-in available after a cancelled passkey attempt", async () => {
    const mockPasskeySignIn = signIn.passkey as ReturnType<typeof vi.fn>;
    mockPasskeySignIn.mockResolvedValue({
      data: null,
      error: { code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", status: 400 },
    });

    render(<LoginPage />);
    fireEvent.click(
      screen.getByRole("button", { name: /sign in with passkey/i }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(restartAutofill).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /sign in$/i })).toBeEnabled();
  });

  it("shows no error when a newer request aborts the passkey attempt", async () => {
    const mockPasskeySignIn = signIn.passkey as ReturnType<typeof vi.fn>;
    mockPasskeySignIn.mockResolvedValue({
      data: null,
      error: { code: "ERROR_CEREMONY_ABORTED", status: 400 },
    });

    render(<LoginPage />);
    fireEvent.click(
      screen.getByRole("button", { name: /sign in with passkey/i }),
    );

    await waitFor(() => expect(restartAutofill).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
