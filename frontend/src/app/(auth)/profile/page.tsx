"use client";

import React from "react";

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
        What we know about you:
        <div>workExperience{userInformation.workExperience.length}</div>
        <div>education{userInformation.education?.notes}</div>
        <div>skills{userInformation.skills.length}</div>
      </div>
    </div>
  );
};

export default Profile;
