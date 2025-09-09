import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "~/auth";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
