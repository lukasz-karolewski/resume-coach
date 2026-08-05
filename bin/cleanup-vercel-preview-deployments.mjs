const protectedBranches = new Set(["main", "master"]);

export function getDeploymentBranch(deployment) {
  const meta = deployment.meta ?? {};
  return [
    deployment.gitSource?.ref,
    meta.githubCommitRef,
    meta.gitCommitRef,
    meta.gitlabCommitRef,
    meta.bitbucketCommitRef,
    meta.branch,
  ].find((candidate) => typeof candidate === "string" && candidate.length > 0);
}

export function selectDeploymentsForStaleCleanup(deployments, openBranches) {
  return deployments.filter((deployment) => {
    if (deployment.target === "production") return false;

    const branch = getDeploymentBranch(deployment);
    return Boolean(
      branch && !protectedBranches.has(branch) && !openBranches.has(branch),
    );
  });
}

export async function cleanupVercelPreviewDeployments({
  branch,
  dryRun,
  env,
  fetchImpl,
  mode,
}) {
  const config = getVercelConfig(env);

  if (mode === "branch") {
    if (!branch) throw new Error("--branch is required when --mode=branch");
    if (protectedBranches.has(branch)) {
      console.log(`Skipping protected branch ${branch}`);
      return { deleted: 0, dryRun, selected: 0 };
    }

    const deployments = await listVercelDeployments(fetchImpl, config, {
      branch,
      target: "preview",
    });
    await deleteDeployments(fetchImpl, config, deployments, dryRun);
    return {
      deleted: dryRun ? 0 : deployments.length,
      dryRun,
      selected: deployments.length,
    };
  }

  const openBranches = await listOpenPullRequestBranches(fetchImpl, env);
  const deployments = await listVercelDeployments(fetchImpl, config, {
    target: "preview",
  });
  const selected = selectDeploymentsForStaleCleanup(deployments, openBranches);
  await deleteDeployments(fetchImpl, config, selected, dryRun);

  return {
    deleted: dryRun ? 0 : selected.length,
    dryRun,
    selected: selected.length,
  };
}

async function deleteDeployments(fetchImpl, config, deployments, dryRun) {
  for (const deployment of deployments) {
    const label = deployment.url ?? deployment.uid;
    if (dryRun) {
      console.log(`[dry-run] Would delete ${label}`);
      continue;
    }

    await vercelFetch(fetchImpl, config, `/v13/deployments/${deployment.uid}`, {
      method: "DELETE",
    });
    console.log(`Deleted ${label}`);
  }
}

async function listOpenPullRequestBranches(fetchImpl, env) {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required for --mode=stale");
  }
  if (!env.GITHUB_REPOSITORY) {
    throw new Error("GITHUB_REPOSITORY is required for --mode=stale");
  }

  const branches = new Set();
  for (let page = 1; ; page += 1) {
    const response = await fetchImpl(
      `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/pulls?state=open&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    if (!response.ok) {
      throw new Error(
        `GitHub API request failed with ${response.status}: ${await response.text()}`,
      );
    }

    const pullRequests = await response.json();
    for (const pullRequest of pullRequests) {
      if (pullRequest.head?.ref) branches.add(pullRequest.head.ref);
    }
    if (pullRequests.length < 100) return branches;
  }
}

async function listVercelDeployments(fetchImpl, config, filters) {
  const deployments = [];
  let until;
  do {
    const params = new URLSearchParams({
      limit: "100",
      projectId: config.projectId,
      target: filters.target,
    });
    if (filters.branch) params.set("branch", filters.branch);
    if (config.teamId) params.set("teamId", config.teamId);
    if (until) params.set("until", until);

    const result = await vercelFetch(
      fetchImpl,
      config,
      `/v7/deployments?${params}`,
      { method: "GET" },
    );
    deployments.push(...(result.deployments ?? []));
    until = result.pagination?.next
      ? String(result.pagination.next)
      : undefined;
  } while (until);
  return deployments;
}

async function vercelFetch(fetchImpl, config, path, init) {
  const response = await fetchImpl(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Vercel API request failed with ${response.status}: ${await response.text()}`,
    );
  }
  return response.json();
}

function getVercelConfig(env) {
  if (!env.VERCEL_TOKEN) throw new Error("VERCEL_TOKEN is required");
  if (!env.VERCEL_PROJECT_ID) throw new Error("VERCEL_PROJECT_ID is required");
  return {
    projectId: env.VERCEL_PROJECT_ID,
    teamId: env.VERCEL_TEAM_ID,
    token: env.VERCEL_TOKEN,
  };
}

function parseArgs(argv) {
  const parsed = { dryRun: false, mode: "branch" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--mode") {
      const value = argv[++index];
      if (value !== "branch" && value !== "stale") {
        throw new Error("--mode must be branch or stale");
      }
      parsed.mode = value;
    } else if (arg === "--branch") {
      parsed.branch = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupVercelPreviewDeployments({
    ...parseArgs(process.argv.slice(2)),
    env: process.env,
    fetchImpl: fetch,
  })
    .then(({ deleted, dryRun, selected }) =>
      console.log(
        `Selected ${selected} deployment(s); deleted ${deleted}; dryRun=${dryRun}`,
      ),
    )
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
