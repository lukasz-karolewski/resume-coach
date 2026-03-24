import clsx from "clsx";
import type { Metadata } from "next";
import { Noto_Serif, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import NiceModalProviderWrapper from "~/components/providers";
import { TRPCReactProvider } from "~/trpc/react";
import "./styles.css";
import { cn } from "~/lib/utils";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const font = Noto_Serif({ subsets: ["latin"] });

export const metadata: Metadata = {
  description: "AI Resume Builder",
  title: "Resume Coach",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn("font-serif", playfairDisplay.variable)}>
      <body className={clsx(font.className, "min-w-96 grid min-h-screen")}>
        <TRPCReactProvider cookies={(await cookies()).toString()}>
          <NiceModalProviderWrapper>{children}</NiceModalProviderWrapper>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
