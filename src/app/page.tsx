import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!session?.user) redirect("/signup");
  else redirect("/resume");
}
