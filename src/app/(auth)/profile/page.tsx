"use client";

import type React from "react";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

const Profile: React.FC = () => {
  const { data: userInformation } = api.profile.getUserInfo.useQuery();

  if (!userInformation) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <Button variant={"secondary"}>import your LinkedIn profile</Button>
      <div>
        <p>Name: {userInformation.name}</p>
        <p>Email: {userInformation.email}</p>
      </div>
    </div>
  );
};

export default Profile;
