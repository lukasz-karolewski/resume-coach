import type { Metadata } from "next";
import { pageMetadata } from "~/app/seo";
import { siteConfig } from "~/app/site-config";

export const metadata: Metadata = {
  ...pageMetadata({
    description:
      "Sign in to Resume Coach to update your accomplishment log, track job applications, and generate tailored resumes.",
    path: "/login",
    title: `Sign In | ${siteConfig.name}`,
  }),
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
