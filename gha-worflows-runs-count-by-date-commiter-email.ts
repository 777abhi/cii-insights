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

  // Create a map to count runs by date (YYYY-MM) and committer's author email
  const runsByDateAndCommitterEmail = new Map<string, Map<string, number>>();

  allRuns.forEach((run) => {
    const authorEmail = run.head_commit?.author?.email;
    const runDate = new Date(run.created_at);
    const yyyyMm = `${runDate.getFullYear()}-${(runDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;

    if (authorEmail) {
      if (!runsByDateAndCommitterEmail.has(yyyyMm)) {
        runsByDateAndCommitterEmail.set(yyyyMm, new Map());
      }
      const dateMap = runsByDateAndCommitterEmail.get(yyyyMm);
      dateMap?.set(
        authorEmail,
        (dateMap.get(authorEmail) || 0) + 1
      );
    }
  });

  // Convert the nested map to an array of objects for console.table
  const tableData = [];
  for (const [date, committers] of runsByDateAndCommitterEmail) {
    for (const [committer, count] of committers) {
      tableData.push({
        Date: date,
        'Committer Email': committer,
        'Workflow Run Count': count,
      });
    }
  }
  
  


  console.log('Workflow runs by date (YYYY-MM) and committer author email:');
  console.table(tableData);

  // Display the grouped data and calculate the sum of Workflow Run Count
  let totalRunCount = 0;

  console.log('Workflow runs by date (YYYY-MM) and committer author email:');
  for (const [date, committers] of runsByDateAndCommitterEmail) {
    for (const [committer, count] of committers) {
      totalRunCount += count; // Calculate the sum
    }
  }

  console.log(`Total Workflow Run Count: ${totalRunCount}`);
}

getWorkflowRuns();