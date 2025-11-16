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
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders login form with all fields", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });

  it("renders link to signup page", () => {
    render(<LoginPage />);

    const signupLink = screen.getByRole("link", { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/signup");
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
      expect(mockPush).toHaveBeenCalledWith("/resume");
    });
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
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
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
      name: /sign in with google/i,
    });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSocialSignIn).toHaveBeenCalledWith({
        callbackURL: "/resume",
        provider: "google",
      });
    });
  });

  it("requires email and password fields", () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      /password/i,
    ) as HTMLInputElement;

    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });
});
