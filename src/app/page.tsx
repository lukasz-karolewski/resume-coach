import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const workflowSteps = [
  {
    description:
      "Drop in a posting link and keep every role, company, and deadline in one organized pipeline.",
    number: "01",
    title: "Capture every opportunity fast",
  },
  {
    description:
      "Turn each posting into an interview brief with themes, likely questions, and preparation priorities.",
    number: "02",
    title: "Prepare with interview-ready context",
  },
  {
    description:
      "Generate role-optimized resumes and tailored cover letters without rebuilding your story from scratch.",
    number: "03",
    title: "Ship tailored applications faster",
  },
] as const;

const outcomes = [
  "One place for job links, notes, and next steps",
  "Role-specific resumes aligned to each posting",
  "Cover letters drafted from the actual job context",
  "Interview prep that stays attached to the role",
] as const;

const surfaces = [
  {
    detail: "Paste a link once. Keep company, title, status, notes, and prep in one timeline.",
    title: "Application tracker",
  },
  {
    detail: "See what the role is really asking for and where your story needs emphasis before you apply.",
    title: "Role analysis",
  },
  {
    detail: "Produce a stronger resume and cover letter pair built around the posting, not generic templates.",
    title: "Application kit",
  },
] as const;

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
      <header className="relative border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-muted-foreground">
              Resume Coach
            </p>
            <p className="text-sm text-muted-foreground">
              Application tracking for serious job searches
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_34%),radial-gradient(circle_at_85%_15%,hsl(var(--accent)/0.24),transparent_24%),linear-gradient(to_bottom,hsl(var(--background)/0.08),transparent_72%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <Badge variant="secondary" className="rounded-full">
                  Track roles. Prep smarter. Apply sharper.
                </Badge>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
                    Turn job links into organized applications, stronger resumes,
                    and better interview prep.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                    Save every posting in one tracker, extract what matters from
                    the role, and generate a resume plus cover letter tailored
                    to each opportunity.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/signup">Start tracking roles</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
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
                          This week
                        </p>
                        <p className="text-2xl font-semibold">12 active roles</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        Focused search
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      <Card className="border-border/60 shadow-none">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            Senior Product Designer
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Resume tailored</span>
                            <span className="font-medium text-foreground">
                              Ready
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Cover letter</span>
                            <span className="font-medium text-foreground">
                              Drafted
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Interview prep</span>
                            <span className="font-medium text-foreground">
                              In progress
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="rounded-2xl bg-muted/70 p-4">
                        <p className="text-sm font-medium">Role themes</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["Portfolio narrative", "Design systems", "Cross-functional leadership"].map(
                            (theme) => (
                              <Badge
                                key={theme}
                                variant="secondary"
                                className="rounded-full"
                              >
                                {theme}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                        Paste a job link. The tracker organizes the role, pulls
                        out priorities, and gets your next draft moving.
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
                Built for the whole application cycle
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Stay organized from first link to final interview.
              </h2>
              <p className="max-w-xl text-base leading-8 text-muted-foreground">
                This is not just a resume editor. It is a search workspace that
                keeps the role, the application materials, and the prep work in
                the same place so momentum does not get lost between tabs.
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
                  Start with your next role
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  Bring every posting into one system and apply with sharper
                  materials.
                </h2>
                <p className="text-base leading-8 text-muted-foreground">
                  Track the opportunity, tailor the resume, draft the cover
                  letter, and prepare for the interview without losing context.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/signup">Create an account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
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
