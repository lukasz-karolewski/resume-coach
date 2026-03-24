"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn } from "~/auth-client";
import { AuthScreen } from "~/components/auth/auth-screen";
import { GoogleIcon } from "~/components/icons";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

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
    <AuthScreen
      badge="Sign in"
      title="Welcome back"
      description="Access your resumes, profile data, and tailored drafts."
      secondaryAction={
        <>
          <div className="relative">
            <Separator />
            <CardDescription className="absolute inset-x-0 -top-3 mx-auto w-fit bg-card px-2">
              Or continue with
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="size-4" />
            Sign in with Google
          </Button>
        </>
      }
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      {error ? (
        <Alert>
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full justify-center"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthScreen>
  );
}
