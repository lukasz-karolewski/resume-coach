import clsx from "clsx";
import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/auth";
import Assistant from "~/components/assistant";
import Footer from "~/components/ui/footer";
import TopNav from "~/components/ui/top-nav";
import { TRPCReactProvider } from "~/trpc/react";

import "./globals.css";

const font = Noto_Serif({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resume Coach",
  description: "AI Resume Builder",
};

export default async function RootLayout({
  children,
  edit,
}: {
  children: React.ReactNode;
  edit: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  return (
    <html lang="en">
      <body className={clsx(font.className, "min-w-96")}>
        <TRPCReactProvider cookies={cookies().toString()}>
          <TopNav />
          <main className="relative min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
            {children}
          </main>
          <Footer />
          {edit}
          <Assistant />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
