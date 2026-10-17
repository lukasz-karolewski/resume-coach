import type { Metadata } from "next";
import { pageMetadata } from "~/app/seo";
import { siteConfig } from "~/app/site-config";

export const metadata: Metadata = {
  ...pageMetadata({
    description:
      "Create a Resume Coach account to log your accomplishments, track job applications, and generate tailored resumes from your real work.",
    path: "/signup",
    title: `Create Account | ${siteConfig.name}`,
  }),
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
