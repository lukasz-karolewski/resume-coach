import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signIn, signUp } from "~/auth-client";
import SignUpPage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock auth-client
vi.mock("~/auth-client", () => ({
  signIn: {
    social: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
}));

describe("SignUpPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders signup form with all fields", () => {
    render(<SignUpPage />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up with google/i }),
    ).toBeInTheDocument();
  });

  it("renders link to login page", () => {
    render(<SignUpPage />);

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("handles successful email signup", async () => {
    const mockEmailSignUp = signUp.email as ReturnType<typeof vi.fn>;
    mockEmailSignUp.mockImplementation((_credentials, { onSuccess }) => {
      onSuccess?.();
      return Promise.resolve();
    });

    render(<SignUpPage />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign up$/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockEmailSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          name: "John Doe",
          password: "password123",
        }),
        expect.any(Object),
      );
      expect(mockPush).toHaveBeenCalledWith("/resume");
    });
  });

  it("displays error message on failed signup", async () => {
    const mockEmailSignUp = signUp.email as ReturnType<typeof vi.fn>;
    mockEmailSignUp.mockImplementation((_credentials, { onError }) => {
      onError?.({ error: { message: "Email already exists" } });
      return Promise.resolve();
    });

    render(<SignUpPage />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign up$/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "existing@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });

  it("shows loading state during sign up", async () => {
    const mockEmailSignUp = signUp.email as ReturnType<typeof vi.fn>;
    mockEmailSignUp.mockImplementation((_credentials, { onRequest }) => {
      onRequest?.();
      return new Promise(() => {}); // Never resolves to keep loading state
    });

    render(<SignUpPage />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign up$/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /creating account.../i }),
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it("handles Google sign up", async () => {
    const mockSocialSignIn = signIn.social as ReturnType<typeof vi.fn>;

    render(<SignUpPage />);

    const googleButton = screen.getByRole("button", {
      name: /sign up with google/i,
    });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSocialSignIn).toHaveBeenCalledWith({
        callbackURL: "/resume",
        provider: "google",
      });
    });
  });

  it("requires all form fields", () => {
    render(<SignUpPage />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      /password/i,
    ) as HTMLInputElement;

    expect(nameInput.required).toBe(true);
    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });

  it("enforces minimum password length", () => {
    render(<SignUpPage />);

    const passwordInput = screen.getByLabelText(
      /password/i,
    ) as HTMLInputElement;

    expect(passwordInput.minLength).toBe(8);
  });

  it("displays password requirement hint", () => {
    render(<SignUpPage />);

    expect(
      screen.getByText(/must be at least 8 characters/i),
    ).toBeInTheDocument();
  });
});
