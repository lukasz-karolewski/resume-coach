import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "~/auth";
import Assistant from "~/components/assistant";
import NiceModalProviderWrapper from "~/components/providers";
import Footer from "~/components/ui/footer";
import { BottomNav } from "~/components/ui/nav-links";
import TopNav from "~/components/ui/top-nav";
import { TRPCReactProvider } from "~/trpc/react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/");

  // tRPC and the modal provider live here rather than in the root layout so
  // anonymous visitors to /r/[slug], the marketing page, and the auth screens
  // do not download and boot a client they never call.
  return (
    <TRPCReactProvider>
      <NiceModalProviderWrapper>
        {/* The bottom padding keeps the footer clear of the phone `BottomNav`. */}
        <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr_auto] pb-(--bottom-nav-clearance)">
          <TopNav />
          <main className="relative bg-muted/30">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
              {children}
            </div>
          </main>
          <Footer />
          <BottomNav />
          <Assistant />
        </div>
      </NiceModalProviderWrapper>
    </TRPCReactProvider>
  );
}
