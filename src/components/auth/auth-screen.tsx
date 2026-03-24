import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface AuthScreenProps {
  badge: string;
  children: ReactNode;
  description: string;
  footer: ReactNode;
  secondaryAction: ReactNode;
  title: string;
}

export function AuthScreen({
  badge,
  children,
  description,
  footer,
  secondaryAction,
  title,
}: AuthScreenProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r bg-muted/40 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative flex max-w-xl flex-col justify-between px-12 py-16">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit rounded-full">
              {badge}
            </Badge>
            <div className="space-y-4">
              <Link
                href="/"
                className="text-sm font-semibold tracking-[0.2em] uppercase"
              >
                Resume Coach
              </Link>
              <h1 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight text-balance">
                Track the role, tailor the story, and walk into the interview
                prepared.
              </h1>
              <p className="max-w-md text-base leading-7 text-muted-foreground">
                Keep every job link, resume draft, cover letter, and prep note
                connected so each application gets sharper with less friction.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">
              What changes in this UI direction
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Clearer hierarchy built from shared shadcn primitives.</li>
              <li>Lower visual noise in forms, nav, and account surfaces.</li>
              <li>
                Reusable app-shell patterns instead of route-specific styling.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-background px-6 py-10 lg:px-10">
        <Card className="w-full max-w-md border-border/70 shadow-lg">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full">
              {badge}
            </Badge>
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            {secondaryAction}
            <div className="text-center text-sm text-muted-foreground">
              {footer}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
