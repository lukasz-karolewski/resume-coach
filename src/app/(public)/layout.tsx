import { Suspense } from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="relative min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
        {children}
      </main>
    </Suspense>
  );
}
