"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "~/auth-client";
import { GoogleIcon } from "~/components/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    await signIn.email(
      {
        email,
        password,
      },
      {
        onError: (ctx) => {
          setIsLoading(false);
          // Provide more specific error message for invalid credentials
          const message = ctx.error.message?.toLowerCase();
          if (
            message?.includes("credentials") ||
            message?.includes("password") ||
            message?.includes("email")
          ) {
            setError("Invalid email or password. Please try again.");
          } else {
            setError(ctx.error.message ?? "Failed to sign in");
          }
        },
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          router.push("/resume");
        },
      },
    );
  };

  const handleGoogleSignIn = async () => {
    await signIn.social({
      callbackURL: "/resume",
      provider: "google",
    });
  };

  return (
    <div className="m-auto flex max-w-md flex-col gap-6 bg-white p-8 shadow-lg dark:bg-gray-800">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to your account
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        <GoogleIcon className="h-5 w-5" />
        Sign in with Google
      </button>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-500 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
