"use client";
/* eslint-disable react/no-unescaped-entities */

import NiceModal from "@ebay/nice-modal-react";
import React from "react";

import { AddJobModal } from "~/components/dashboard/addJobModal";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

const Dashboard: React.FC = () => {
  const { data: jobs, refetch } = api.job.getJobs.useQuery();

  if (!jobs) {
    return <div>Loading...</div>;
  }

  async function showAddJobModal() {
    await NiceModal.show(AddJobModal);
    refetch();
  }

  return (
    <div>
      <div>
        <Button onClick={showAddJobModal}>Add Job</Button>
      </div>

      <div>
        Jobs you're applying to:
        {jobs.map((job) => {
          return (
            <div key={job.id}>
              <a href={job.url} target="_blank">
                {job.title} at {job.company}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
