import { Octokit } from "octokit";

const token = "xx"; // Replace with your GitHub personal access token
const octokit = new Octokit({
  auth: token,
});

async function getWorkflowRuns() {
  const owner = "xx"; // Replace with the GitHub repository owner
  const repo = "xx";
  
  const perPage = 100; // Number of workflow runs per page
  let page = 1;
  let allRuns = [];

  while (true) {
    const response = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: perPage,
      page,
    });

    if (response.status !== 200) {
      console.error('Failed to fetch workflow runs');
      return;
    }

    const runs = response.data.workflow_runs;

    if (runs.length === 0) {
      break; // No more runs to fetch
    }

    allRuns.push(...runs);
    page++;
  }

  // Create a map to count passed and failed runs by date (YYYY-MM)
  const runsByDate = new Map<string, { passed: number; failed: number }>();

  allRuns.forEach((run) => {
    const runStatus = run.conclusion;
    const runDate = new Date(run.created_at);
    const yyyyMm = `${runDate.getFullYear()}-${(runDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;

    if (!runsByDate.has(yyyyMm)) {
      runsByDate.set(yyyyMm, { passed: 0, failed: 0 });
    }

    if (runStatus === 'success') {
      runsByDate.get(yyyyMm)!.passed++;
    } else if (runStatus === 'failure') {
      runsByDate.get(yyyyMm)!.failed++;
    }
  });

  // Display the grouped data
  console.log('Workflow runs by date (YYYY-MM) with Pass/Fail counts:');
  console.log('Date   | Passed | Failed');
  for (const [date, counts] of runsByDate) {
    console.log(`${date} | ${counts.passed}      | ${counts.failed}`);
  }
}

getWorkflowRuns();