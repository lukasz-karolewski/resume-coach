import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "~/auth";
import Assistant from "~/components/assistant";
import NiceModalProviderWrapper from "~/components/providers";
import Footer from "~/components/ui/footer";
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
        <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
          <TopNav />
          <main className="relative bg-muted/30">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
          </main>
          <Footer />
          <Assistant />
        </div>
      </NiceModalProviderWrapper>
    </TRPCReactProvider>
  );
}
