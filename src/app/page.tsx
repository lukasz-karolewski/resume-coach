import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "~/app/site-config";
import { auth } from "~/auth";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const workflowSteps = [
  {
    description:
      "Log what you ship, lead, and fix as it happens — raw notes are fine. Monthly reminders keep your profile current so you never reconstruct from memory.",
    number: "01",
    title: "Track accomplishments continuously",
  },
  {
    description:
      "Paste a job link. We scrape the posting, research the company culture, and surface what the role actually values — all visible and editable.",
    number: "02",
    title: "Add a role you want",
  },
  {
    description:
      "Get a resume and cover letter built from your real accomplishments, rephrased for the role. Every bullet traces back to something you actually did.",
    number: "03",
    title: "Get a tailored resume in minutes",
  },
] as const;

const outcomes = [
  "A living profile of your career accomplishments",
  "Resumes tailored per role — grounded in your real work",
  "Cover letters that match without making things up",
  "Perf review drafts from the same accomplishment log",
] as const;

const surfaces = [
  {
    detail:
      "Your accomplishments organized by role, always up to date. Configurable reminders so you log wins while they're fresh — not months later.",
    title: "Accomplishment profile",
  },
  {
    detail:
      "AI selects and rephrases your accomplishments for each role. It picks, prioritizes, and phrases — but never invents.",
    title: "Grounded resume generation",
  },
  {
    detail:
      "Track every application from saved through offer. Notes, tailored resumes, and job context stay connected per role.",
    title: "Job tracker",
  },
] as const;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description: siteConfig.description,
  openGraph: {
    description: siteConfig.description,
    title:
      "Resume Coach — Log accomplishments. Get tailored resumes. No hallucinations.",
    type: "website",
    url: siteConfig.url,
  },
  title:
    "Resume Coach — Log accomplishments. Get tailored resumes. No hallucinations.",
  twitter: {
    description: siteConfig.description,
    title:
      "Resume Coach — Log accomplishments. Get tailored resumes. No hallucinations.",
  },
};

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/resume");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.55)_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,hsl(var(--primary)/0.38),transparent_22%),radial-gradient(circle_at_88%_10%,hsl(var(--accent)/0.34),transparent_20%),radial-gradient(circle_at_50%_42%,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_18%_78%,hsl(var(--accent)/0.18),transparent_24%),linear-gradient(180deg,hsl(var(--primary)/0.08),transparent_22%,transparent_68%,hsl(var(--accent)/0.12))]" />

      <main className="relative">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_34%),radial-gradient(circle_at_85%_15%,hsl(var(--accent)/0.24),transparent_24%),linear-gradient(to_bottom,hsl(var(--background)/0.08),transparent_72%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold tracking-[0.22em] uppercase text-muted-foreground">
                    Resume Coach
                  </p>
                </div>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
                    Your career story, logged as it happens. Deployed when it
                    matters.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                    Track your accomplishments monthly — not when you&apos;re
                    scrambling to job hunt. When you find the right role, get a
                    resume built entirely from what you actually did.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/signup">Start logging accomplishments</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7"
                >
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {outcomes.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:justify-self-end">
              <div className="rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-2xl shadow-primary/5">
                <div className="rounded-[1.6rem] border border-border/60 bg-background p-5">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Your profile
                        </p>
                        <p className="text-2xl font-semibold">
                          47 accomplishments
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        Always current
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      <Card className="border-border/60 shadow-none">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            Senior Software Engineer
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Accomplishments logged</span>
                            <span className="font-medium text-foreground">
                              18
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Tailored resumes</span>
                            <span className="font-medium text-foreground">
                              3
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Last updated</span>
                            <span className="font-medium text-foreground">
                              2 days ago
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="rounded-2xl bg-muted/70 p-4">
                        <p className="text-sm font-medium">
                          Recent accomplishments
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            "Led k8s migration",
                            "Reduced deploy time 82%",
                            "Mentored 3 engineers",
                          ].map((item) => (
                            <Badge
                              key={item}
                              variant="secondary"
                              className="rounded-full"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                        Monthly reminder: What did you ship, fix, or lead this
                        month? Log it now — your future resume will thank you.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 py-18">
          <div className="pointer-events-none absolute inset-x-6 inset-y-6 rounded-[2rem] bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.12),transparent_26%),radial-gradient(circle_at_85%_100%,hsl(var(--accent)/0.14),transparent_24%)]" />
          <div className="grid gap-6 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <Card
                key={step.number}
                className="border-border/70 bg-card/80 shadow-sm transition-transform hover:-translate-y-1"
              >
                <CardHeader className="space-y-4">
                  <Badge variant="outline" className="w-fit rounded-full">
                    {step.number}
                  </Badge>
                  <CardTitle className="text-2xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  {step.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="relative border-y border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted)/0.62),hsl(var(--background)/0.9))]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_50%,hsl(var(--primary)/0.16),transparent_20%),radial-gradient(circle_at_88%_40%,hsl(var(--accent)/0.2),transparent_18%)]" />
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-18 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full">
                Built for your whole career, not just job hunts
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                The best time to write your resume is every month.
              </h2>
              <p className="max-w-xl text-base leading-8 text-muted-foreground">
                Most people reconstruct years of work from memory when they
                suddenly need a resume. Resume Coach flips that — you log wins
                continuously, and when the right role appears, your resume
                writes itself from real data.
              </p>
            </div>

            <div className="grid gap-4">
              {surfaces.map((surface) => (
                <div
                  key={surface.title}
                  className="rounded-2xl border border-border/70 bg-background px-5 py-5 shadow-sm"
                >
                  <p className="text-lg font-semibold">{surface.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {surface.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 py-18">
          <div className="pointer-events-none absolute inset-x-6 inset-y-8 rounded-[2rem] bg-[radial-gradient(circle_at_0%_50%,hsl(var(--primary)/0.14),transparent_24%),radial-gradient(circle_at_100%_50%,hsl(var(--accent)/0.16),transparent_22%)]" />
          <div className="relative rounded-[2rem] border border-border/70 bg-card/92 px-8 py-10 shadow-sm backdrop-blur md:px-12 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-3">
                <Badge variant="outline" className="rounded-full">
                  Start with what you&apos;ve already done
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  Your accomplishments are the asset. We just help you deploy
                  them.
                </h2>
                <p className="text-base leading-8 text-muted-foreground">
                  Log your work, keep it current, and when you&apos;re ready to
                  move — get a resume that&apos;s authentic, tailored, and
                  grounded in what you actually did.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/signup">Create your profile</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
