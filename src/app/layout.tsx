import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import { Noto_Serif, Playfair_Display } from "next/font/google";
import { pageMetadata } from "~/app/seo";
import { siteConfig } from "~/app/site-config";
import { Toaster } from "~/components/ui/toast";
import { cn } from "~/lib/utils";
import "./styles.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const font = Noto_Serif({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...pageMetadata({
    description: siteConfig.description,
    path: "/",
    title: siteConfig.name,
  }),
  applicationName: siteConfig.name,
  category: "career",
  keywords: [
    "AI resume builder",
    "tailored resume",
    "accomplishment tracker",
    "brag document",
    "resume coach",
    "job application tracker",
  ],
  metadataBase: new URL(siteConfig.url),
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: siteConfig.name,
    template: siteConfig.titleTemplate,
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn("font-serif", playfairDisplay.variable)}>
      <body className={clsx(font.className, "grid min-h-dvh min-w-96")}>
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
