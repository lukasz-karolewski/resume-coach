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
    headers: await headers(), // you need to pass the headers object.
  });
  if (!session?.user) redirect("/");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TopNav />
      <main className="relative min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
        {children}
      </main>
      <Footer />
      <Assistant />
    </Suspense>
  );
}
