import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "~/app/site-config";
import { auth } from "~/auth";
import { Button } from "~/components/ui/button";

const steps = [
  {
    accent: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-600/20 dark:bg-blue-400/20",
    description:
      "Log what you ship, lead, and fix as it happens — raw notes are fine. Monthly reminders keep your profile current so you never reconstruct from memory.",
    number: "01",
    title: "Track accomplishments continuously",
  },
  {
    accent: "text-violet-600 dark:text-violet-400",
    bar: "bg-violet-600/20 dark:bg-violet-400/20",
    description:
      "Paste a job link. We scrape the posting, research the company culture, and surface what the role actually values — all visible and editable by you.",
    number: "02",
    title: "Add a role you want",
  },
  {
    accent: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-600/20 dark:bg-emerald-400/20",
    description:
      "Get a resume and cover letter built from your real accomplishments, rephrased for the role. Every bullet traces back to something you actually did.",
    number: "03",
    title: "Get a tailored resume in minutes",
  },
] as const;

const features = [
  {
    description:
      "Your accomplishments organized by role, always up to date. Configurable reminders so you log wins while they're fresh — not months later.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
    title: "Accomplishment profile",
  },
  {
    description:
      "AI selects and rephrases your accomplishments for each role. It picks, prioritizes, and phrases — but never invents.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
        />
      </svg>
    ),
    title: "Grounded resume generation",
  },
  {
    description:
      "Track every application from saved through offer. Notes, tailored resumes, and job context stay connected per role.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
        />
      </svg>
    ),
    title: "Job tracker",
  },
  {
    description:
      "When review season comes, get a draft pulled straight from your accomplishment log. The same data powers your resume and your self-review.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    ),
    title: "Performance review drafts",
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.2em] uppercase text-foreground"
          >
            Resume Coach
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.65_0.15_250/0.15),transparent)]" />
          <div className="mx-auto max-w-5xl px-6 pb-32 pt-24 md:pb-40 md:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium tracking-wide text-blue-600 dark:text-blue-400">
                For tech professionals who take their careers seriously
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-[1.1] tracking-tight md:text-7xl">
                Your career story,{" "}
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-violet-400 dark:to-emerald-400">
                  logged as it happens.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Track your accomplishments monthly — not when you&apos;re
                scrambling. When the right role appears, get a resume built
                entirely from what you actually did.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="px-8">
                  <Link href="/signup">Start logging accomplishments</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof / key insight */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
            <blockquote className="mx-auto max-w-3xl text-center">
              <p className="text-2xl font-medium leading-relaxed tracking-tight text-foreground md:text-3xl">
                &ldquo;The best time to write your resume is{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  every month
                </span>
                , not when you&apos;re job hunting.&rdquo;
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                Most people reconstruct years of work from foggy memory when
                they suddenly need a resume. Resume Coach flips that — you log
                wins continuously, and when the right role appears, your resume
                writes itself from real data.
              </p>
            </blockquote>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="text-center">
            <p className="text-sm font-medium tracking-wide text-violet-600 dark:text-violet-400">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Three steps. Zero fabrication.
            </h2>
          </div>

          <div className="mt-16 space-y-16 md:mt-20 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${step.accent}`}
                >
                  <span
                    className={`inline-block h-px w-8 ${step.bar}`}
                    aria-hidden
                  />
                  {step.number}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-emerald-600 dark:text-emerald-400">
                Built for your whole career, not just job hunts
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                One profile. Every use case.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                The same accomplishment log powers tailored resumes, cover
                letters, job tracking, and performance reviews.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/70">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The promise */}
        <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              No hallucinations. Ever.
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
              Every bullet on your resume traces back to something you actually
              did.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Other AI tools invent accomplishments, inflate metrics, and
              produce resumes that fall apart in interviews. Resume Coach only
              works with what you&apos;ve logged — it selects, rephrases, and
              prioritizes, but it never fabricates.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,oklch(0.65_0.15_250/0.12),transparent)]" />
            <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-32">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Your accomplishments are the asset.
                  <br />
                  <span className="text-muted-foreground">
                    We just help you deploy them.
                  </span>
                </h2>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" className="px-8">
                    <Link href="/signup">Create your profile</Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            <div className="space-y-3 text-center sm:text-left">
              <Link
                href="/"
                className="text-sm font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Resume Coach
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Log accomplishments. Get tailored resumes. No hallucinations.
              </p>
            </div>

            <div className="flex gap-12 text-sm">
              <div className="space-y-3">
                <p className="font-medium text-foreground">Product</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link
                      href="/signup"
                      className="transition-colors hover:text-foreground"
                    >
                      Get started
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="transition-colors hover:text-foreground"
                    >
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-foreground">Legal</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <span className="cursor-default">Privacy</span>
                  </li>
                  <li>
                    <span className="cursor-default">Terms</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Resume Coach. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
