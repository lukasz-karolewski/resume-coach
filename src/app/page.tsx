import {
  BookOpenIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageMetadata } from "~/app/seo";
import { siteConfig } from "~/app/site-config";
import { landingPageJsonLd, serializeJsonLd } from "~/app/structured-data";
import { auth } from "~/auth";
import { Button } from "~/components/ui/button";
import { Logo } from "~/components/ui/logo";

const steps = [
  {
    accent: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-600/20 dark:bg-blue-400/20",
    description:
      "Add what you shipped, led, and fixed under each role while the details are fresh. Rough notes are fine; you can polish them later.",
    number: "01",
    title: "Log your accomplishments",
  },
  {
    accent: "text-violet-600 dark:text-violet-400",
    bar: "bg-violet-600/20 dark:bg-violet-400/20",
    description:
      "Paste a link to a posting and Resume Coach pulls in the job description, so you can see what the role asks for and track it from saved to offer.",
    number: "02",
    title: "Save the jobs you want",
  },
  {
    accent: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-600/20 dark:bg-emerald-400/20",
    description:
      "Pick a job and get a resume built from the accomplishments that fit it. Then refine the wording with the AI coach until it reads right.",
    number: "03",
    title: "Generate a tailored resume",
  },
] as const;

const features = [
  {
    description:
      "Your wins organized by role in one place, so every new resume starts from specifics instead of a blank page.",
    icon: BookOpenIcon,
    title: "Accomplishment log",
  },
  {
    description:
      "Chat with a coach that reviews your resume, tightens bullets, and adapts them to a job description, editing the resume as you talk.",
    icon: ChatBubbleLeftRightIcon,
    title: "AI resume coach",
  },
  {
    description:
      "Follow each application through applied, interview, and offer, with the posting, your notes, and its tailored resumes kept together.",
    icon: BriefcaseIcon,
    title: "Job tracker",
  },
  {
    description:
      "Download a clean PDF for applications, or share a private link that always shows your latest version.",
    icon: DocumentArrowDownIcon,
    title: "PDF export and share links",
  },
  {
    description:
      "Connect an AI assistant that supports MCP, such as ChatGPT or Claude, to read and update your resumes from where you already work.",
    icon: PuzzlePieceIcon,
    title: "Works with your AI assistant",
  },
] as const;

const pageTitle = `${siteConfig.name}: ${siteConfig.tagline}`;

export const metadata: Metadata = {
  ...pageMetadata({
    description: siteConfig.description,
    path: "/",
    title: pageTitle,
  }),
  // `absolute` skips the root "%s | Resume Coach" template, which would
  // repeat the product name.
  title: { absolute: pageTitle },
};

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/jobs");
  }

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-background text-foreground">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, escaped by serializeJsonLd
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(landingPageJsonLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Button render={<Link href="/login" />} variant="ghost" size="sm">
              Sign in
            </Button>
            <Button render={<Link href="/signup" />} size="sm">
              Get started
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
                An AI resume builder grounded in your real work
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-[1.1] tracking-tight text-balance md:text-7xl">
                Your career story,{" "}
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-violet-400 dark:to-emerald-400">
                  logged as it happens.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Write down your wins while they&apos;re fresh. When the right
                role comes along, get a tailored resume built from what you
                actually did.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  render={<Link href="/signup" />}
                  size="lg"
                  className="px-8"
                >
                  Start your accomplishment log
                </Button>
                <Button
                  render={<Link href="/login" />}
                  size="lg"
                  variant="ghost"
                >
                  I already have an account
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Key insight */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-medium leading-relaxed tracking-tight text-balance md:text-3xl">
                The best time to write your resume is{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  long before you need it
                </span>
                .
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
                Most people rebuild years of work from memory the week they
                start job hunting, and the details that make a resume convincing
                are the first to go. Keep a running log instead, and every
                resume starts from real numbers, names, and outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="text-center">
            <p className="text-sm font-medium tracking-wide text-violet-600 dark:text-violet-400">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Three steps. Nothing made up.
            </h2>
          </div>

          <ol className="mt-16 space-y-16 md:mt-20 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
            {steps.map((step) => (
              <li key={step.number} className="relative">
                <div
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${step.accent}`}
                  aria-hidden
                >
                  <span className={`inline-block h-px w-8 ${step.bar}`} />
                  {step.number}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-emerald-600 dark:text-emerald-400">
                One log, every resume
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Everything starts from your accomplishments.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Log your work once, then reuse it for every application you
                send.
              </p>
            </div>

            <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/70">
                    <feature.icon className="size-6" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* The promise */}
        <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
              <CheckIcon className="size-4" strokeWidth={2} aria-hidden />
              Grounded in your real work
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Every bullet on your resume traces back to something you actually
              did.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Many AI resume tools pad your experience with achievements you
              never had, and those fall apart in an interview. Resume Coach
              starts from what you&apos;ve logged. It selects, reorders, and
              rephrases your work without inventing new work.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,oklch(0.65_0.15_250/0.12),transparent)]" />
            <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-32">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  Your accomplishments are your best asset.
                  <br />
                  <span className="text-muted-foreground">
                    Keep them ready for the next role.
                  </span>
                </h2>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    render={<Link href="/signup" />}
                    size="lg"
                    className="px-8"
                  >
                    Create your account
                  </Button>
                  <Button
                    render={<Link href="/login" />}
                    size="lg"
                    variant="ghost"
                  >
                    Sign in
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
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Logo nameVisibility="always" />
              <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
                {siteConfig.tagline}
              </p>
            </div>

            <nav aria-label="Footer" className="space-y-3 text-sm">
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
            </nav>
          </div>

          <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
