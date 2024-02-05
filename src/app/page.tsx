import { redirect } from "next/navigation";

import { auth } from "~/auth";

/* eslint-disable react/no-unescaped-entities */
export default async function HomePage() {
  const session = await auth();

  if (session?.user) redirect("/dashboard");

  return (
    <div className="m-auto flex max-w-4xl flex-col gap-4 bg-white p-12 shadow-lg dark:bg-gray-800 print:p-0 print:shadow-none">
      <h2>
        Craft custom resumes and cover letters for each job you're applying to.
      </h2>
      <p>
        We'll help you stand out from the crowd and get the job you want. Sign
        up now to get started and see what we have to offer.
      </p>

      <div className="flex flex-col gap-4">
        <a
          href="/api/auth/signin"
          className="rounded-md bg-blue-500 py-2 text-center text-white"
        >
          Sign up
        </a>
        <a
          href="/api/auth/signin"
          className="rounded-md bg-gray-200 py-2 text-center text-gray-800"
        >
          Log in
        </a>
      </div>
    </div>
  );
}
