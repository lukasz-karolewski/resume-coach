import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";

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
      <body className={font.className}>{children}</body>
    </html>
  );
}
