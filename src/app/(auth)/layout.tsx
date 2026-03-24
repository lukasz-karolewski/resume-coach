import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "~/auth";
import Assistant from "~/components/assistant";
import Footer from "~/components/ui/footer";
import TopNav from "~/components/ui/top-nav";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TopNav />
      <main className="relative min-h-screen bg-muted/30">
        <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl px-6 py-8">
          <div className="w-full">{children}</div>
        </div>
      </main>
      <Footer />
      <Assistant />
    </Suspense>
  );
}
