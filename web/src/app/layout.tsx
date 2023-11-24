import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";

import Assistant from "~/components/assistant";
import TopNav from "~/components/ui/top-nav";

import { TRPCReactProvider } from "../trpc/react";

const font = Noto_Serif({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lukasz Karolewski",
  description: "Lukasz Karolewski personal website",
};

export default function RootLayout({
  children,
  edit,
}: {
  children: React.ReactNode;
  edit: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className}>
        <TRPCReactProvider cookies={cookies().toString()}>
          <TopNav />
          <main className="relative min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
            {children}
          </main>
          {edit}
          <Assistant />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
