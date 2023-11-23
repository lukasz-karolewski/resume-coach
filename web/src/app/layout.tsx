import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import TopNav from "~/app/components/ui/top-nav";
import Assistant from "~/app/components/assistant";
import { TRPCReactProvider } from "../trpc/react";
import { cookies } from "next/headers";

const font = Noto_Serif({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lukasz Karolewski",
  description: "Lukasz Karolewski personal website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className}>
        <TRPCReactProvider cookies={cookies().toString()}>
          <TopNav />
          <main className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
            {children}
          </main>
          <Assistant />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
