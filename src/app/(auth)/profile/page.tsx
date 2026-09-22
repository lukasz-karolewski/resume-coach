import { Suspense } from "react";

import { ProfilePageClient } from "~/components/profile/profile-page-client";
import {
  accomplishmentProfileQuery,
  connectedAppsQuery,
  userInformationQuery,
} from "~/components/profile/profile-queries";
import PageLoading from "~/components/ui/page-loading";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default function ProfilePage() {
  prefetch(userInformationQuery(trpc));
  prefetch(accomplishmentProfileQuery(trpc));
  prefetch(connectedAppsQuery(trpc));

  return (
    <HydrateClient>
      <Suspense fallback={<PageLoading variant="panel" />}>
        <ProfilePageClient />
      </Suspense>
    </HydrateClient>
  );
}
