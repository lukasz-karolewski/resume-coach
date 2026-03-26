"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn, signUp } from "~/auth-client";
import { AuthScreen } from "~/components/auth/auth-screen";
import { GoogleIcon } from "~/components/icons";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    await signUp.email(
      {
        email,
        name,
        password,
      },
      {
        onError: (ctx) => {
          setIsLoading(false);
          const message = ctx.error.message?.toLowerCase();
          if (
            message?.includes("already") ||
            message?.includes("exists") ||
            message?.includes("duplicate")
          ) {
            setError(
              "This email is already registered. Please sign in instead.",
            );
          } else {
            setError(ctx.error.message ?? "Failed to sign up");
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
      badge="Get started"
      title="Start logging your accomplishments"
      description="Build your career profile over time. When the right role comes along, get a resume that's grounded in what you actually did."
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
            Continue with Google
          </Button>
        </>
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {error ? (
        <Alert>
          <AlertTitle>Sign up failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

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
            minLength={8}
            required
          />
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full justify-center"
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
    </AuthScreen>
  );
}
