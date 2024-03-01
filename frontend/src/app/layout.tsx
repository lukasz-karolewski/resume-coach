import clsx from "clsx";
import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import { cookies } from "next/headers";

import Assistant from "~/components/assistant";
import NiceModalProviderWrapper from "~/components/providers";
import Footer from "~/components/ui/footer";
import TopNav from "~/components/ui/top-nav";
import { TRPCReactProvider } from "~/trpc/react";

import "./styles.css";

const font = Noto_Serif({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resume Coach",
  description: "AI Resume Builder",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={clsx(font.className, "min-w-96")}>
        <TRPCReactProvider cookies={cookies().toString()}>
          <NiceModalProviderWrapper>
            <TopNav />
            <main className="relative min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
              {children}
            </main>
            <Footer />
            <Assistant />
          </NiceModalProviderWrapper>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
