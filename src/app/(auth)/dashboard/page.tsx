/* eslint-disable react/no-unescaped-entities */

import React from "react";

import { api } from "~/trpc/server";

const Dashboard: React.FC = async () => {
  const userInformation = await api.resume.getUserInfo.query();

  const jobs = await api.resume.getJobs.query();
  return (
    <div>
      <div>
        Jobs you're applying to:
        {jobs.map((job) => {
          return <div key={job.id}>{job.title}</div>;
        })}
      </div>

      <div>
        What we know about you:
        <div>workExperience{userInformation.workExperience.length}</div>
        <div>education{userInformation.education.length}</div>
        <div>skills{userInformation.skills.length}</div>
      </div>
    </div>
  );
};

export default Dashboard;
