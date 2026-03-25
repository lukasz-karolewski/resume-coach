import { Analytics } from "@vercel/analytics/next";
import clsx from "clsx";
import type { Metadata } from "next";
import { Noto_Serif, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import { siteConfig } from "~/app/site-config";
import NiceModalProviderWrapper from "~/components/providers";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { TRPCReactProvider } from "~/trpc/react";
import "./styles.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const font = Noto_Serif({ subsets: ["latin"] });

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  applicationName: siteConfig.name,
  category: "career",
  description: siteConfig.description,
  keywords: [
    "application tracker",
    "job application tracker",
    "resume builder",
    "cover letter generator",
    "interview preparation",
    "job search organizer",
  ],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },
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
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    title: siteConfig.name,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn("font-serif", playfairDisplay.variable)}>
      <body className={clsx(font.className, "min-w-96 grid min-h-screen")}>
        <TRPCReactProvider cookies={(await cookies()).toString()}>
          <NiceModalProviderWrapper>
            {children}
            <Toaster />
          </NiceModalProviderWrapper>
        </TRPCReactProvider>
        <Analytics />
      </body>
    </html>
  );
}
