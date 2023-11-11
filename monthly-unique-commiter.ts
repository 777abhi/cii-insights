import { Octokit } from "@octokit/rest";

async function getUniqueCommitersCount(owner: string, repo: string) {
  const octokit = new Octokit();

  // Get all workflow runs from the repository
  const response = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    per_page: 100, // Adjust as needed
  });

  const workflowRuns = response.data.workflow_runs;

  // Group commits by month and count unique committers
  const uniqueCommitersByMonth: Record<string, Set<string>> = {};

  for (const run of workflowRuns) {
    const runDate = new Date(run.created_at);
    const monthKey = `${runDate.getFullYear()}-${runDate.toLocaleString('default', { month: 'short' })}`;

    if (!uniqueCommitersByMonth[monthKey]) {
      uniqueCommitersByMonth[monthKey] = new Set();
    }

    const commit = run.head_commit;
    if (commit) {
      uniqueCommitersByMonth[monthKey].add(commit.author?.email || "");
    }
  }

  // Convert Set to Array for each month
  const result = Object.keys(uniqueCommitersByMonth).map((month) => ({
    date: month,
    count: uniqueCommitersByMonth[month].size,
  }));

  return result;
}

async function main() {
  const owner = "your-github-username";
  const repo = "your-repository-name";

  const uniqueCommitersCount = await getUniqueCommitersCount(owner, repo);
  console.log(uniqueCommitersCount);
}

main();
