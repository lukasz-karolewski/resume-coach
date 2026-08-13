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
    social: vi.fn(),
  },
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

  it("shows the account link directly below the form without badges", () => {
    render(<LoginPage />);

    const form = screen
      .getByRole("button", { name: /sign in$/i })
      .closest("form");
    const signupPrompt = screen
      .getByText(/Don't have an account/i)
      .closest("p");

    expect(screen.queryByText("Welcome back")).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="badge"]'),
    ).not.toBeInTheDocument();
    expect(form?.nextElementSibling).toBe(signupPrompt);
  });

  it("displays error message on failed login", async () => {
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

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email or password. Please try again."),
      ).toBeInTheDocument();
    });
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
});
