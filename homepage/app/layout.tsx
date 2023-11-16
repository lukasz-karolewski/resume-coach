import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import TopNav from "./components/top-nav";
import Assistant from "./components/assistant";

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
        <TopNav />
        <main className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
        <Assistant />
      </body>
    </html>
  );
}
