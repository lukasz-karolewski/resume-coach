import React from "react";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";

const Profile: React.FC = async () => {
  const userInformation = await api.profile.getUserInfo.query();

  return (
    <div>
      <Button variant={"secondary"}>import your LinkedIn profile</Button>
      <div>
        What we know about you:
        <div>workExperience{userInformation.workExperience.length}</div>
        <div>education{userInformation.education.length}</div>
        <div>skills{userInformation.skills.length}</div>
      </div>
    </div>
  );
};

export default Profile;
