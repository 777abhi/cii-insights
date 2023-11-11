import { Octokit } from "@octokit/rest";

async function getWorkflowRuns(owner: string, repo: string) {
  const octokit = new Octokit();

  const response = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id: '.github/workflows/your-workflow-file.yml', // Update with your workflow file name
    per_page: 100, // Adjust as needed
  });

  return response.data.workflow_runs;
}

function calculatePercentile(data: number[], percentile: number) {
  const sortedData = data.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sortedData.length) - 1;
  return sortedData[index];
}

async function main() {
  const owner = "your-github-username";
  const repo = "your-repository-name";

  const runs = await getWorkflowRuns(owner, repo);

  // Group runs by date
  const groupedRuns = runs.reduce((acc, run) => {
    const date = new Date(run.created_at).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(run);
    return acc;
  }, {});

  // Calculate 90th percentile for each day
  const percentilesByDay = Object.keys(groupedRuns).map((date) => {
    const durations = groupedRuns[date].map((run) => run.duration);
    const percentile90 = calculatePercentile(durations, 90);
    return { date, percentile90 };
  });

  console.log(percentilesByDay);
}

main();
