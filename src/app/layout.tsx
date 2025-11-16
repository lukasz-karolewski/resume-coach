import clsx from "clsx";
import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import { cookies } from "next/headers";

import { TRPCReactProvider } from "~/trpc/react";

import NiceModalProviderWrapper from "~/components/providers";
import "./styles.css";

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
    <html lang="en">
      <body className={clsx(font.className, "min-w-96 grid min-h-screen")}>
        <TRPCReactProvider cookies={(await cookies()).toString()}>
          <NiceModalProviderWrapper>{children}</NiceModalProviderWrapper>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
