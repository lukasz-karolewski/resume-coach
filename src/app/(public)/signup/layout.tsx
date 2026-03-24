import type { Metadata } from "next";
import { siteConfig } from "~/app/site-config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/signup",
  },
  description:
    "Create a Resume Coach account to track job applications, generate tailored resumes and cover letters, and prepare for interviews.",
  openGraph: {
    description:
      "Create a Resume Coach account to track job applications, generate tailored resumes and cover letters, and prepare for interviews.",
    title: `Create Account | ${siteConfig.name}`,
    url: `${siteConfig.url}/signup`,
  },
  robots: {
    follow: false,
    index: false,
  },
  title: "Create Account",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
