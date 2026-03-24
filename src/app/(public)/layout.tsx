import { Suspense } from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="relative min-h-screen bg-background">{children}</main>
    </Suspense>
  );
}
