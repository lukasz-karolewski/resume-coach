import type { Metadata } from "next";
import { siteConfig } from "~/app/site-config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/login",
  },
  description:
    "Sign in to Resume Coach to manage your application tracker, tailored resumes, cover letters, and interview prep.",
  openGraph: {
    description:
      "Sign in to Resume Coach to manage your application tracker, tailored resumes, cover letters, and interview prep.",
    title: `Sign In | ${siteConfig.name}`,
    url: `${siteConfig.url}/login`,
  },
  robots: {
    follow: false,
    index: false,
  },
  title: "Sign In",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
