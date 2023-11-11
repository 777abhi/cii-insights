import { test } from "@playwright/test";
import { Octokit } from "octokit";

// Create an Octokit instance by providing your GitHub personal access token or authentication method.
const octokit = new Octokit({
  auth: "xx",
});

test("API - GitHub", async () => {
  const owner = "xx";
  const repo = "xx";

  const runs = await getWorkflowRuns(owner,repo); 

  const uniqueCommitersCount = await getUniqueCommitersCount(runs);
  console.log(uniqueCommitersCount);
  console.table(uniqueCommitersCount);
  const percentilesByDay = calculatePercentileByDay(runs);
  console.log(percentilesByDay);
});

async function getUniqueCommitersCount(workflowRuns : any) {
  
  // Group commits by month and store unique committer emails
  const uniqueCommitersByMonth: Record<string, string[]> = {};

  for (const run of workflowRuns) {
    const runDate = new Date(run.created_at);
    const monthKey = `${runDate.getFullYear()}-${runDate.toLocaleString(
      "default",
      { month: "short" }
    )}`;

    if (!uniqueCommitersByMonth[monthKey]) {
      uniqueCommitersByMonth[monthKey] = [];
    }

    const commit = run.head_commit;
    if (commit) {
      const commitEmail = commit.author?.email || "";
      if (!uniqueCommitersByMonth[monthKey].includes(commitEmail)) {
        uniqueCommitersByMonth[monthKey].push(commitEmail);
      }
    }
  }

  // Convert the data to the desired format
  const result = Object.keys(uniqueCommitersByMonth).map((month) => ({
    date: month,
    commiters: uniqueCommitersByMonth[month],
    count: uniqueCommitersByMonth[month].length,
  }));

  return result;
}


function calculatePercentile(data: number[], percentileValue: number) {
  const sortedData = data.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sortedData.length) - 1;
  return sortedData[index];
}

async function calculatePercentileByDay(runs: any) {
  

  // Group runs by date
  const groupedRuns: Record<string, number[]> = {};

  for (const run of runs) {
    const runDate = new Date(run.created_at);
    const dateKey = `${runDate.getDate()}${runDate.toLocaleString('default', { month: 'short' })}${runDate.getFullYear()}`;

    if (!groupedRuns[dateKey]) {
      groupedRuns[dateKey] = [];
    }

    groupedRuns[dateKey].push(calculateTimeDifferenceInHours(run.created_at, run.updated_at) || 0);
  }

  // Calculate 90th percentile for each day
  const percentilesByDay: Record<string, number> = {};

  for (const dateKey in groupedRuns) {
    const percentile90 = calculatePercentile(groupedRuns[dateKey], 90);
    percentilesByDay[dateKey] = percentile90;
  }

  return percentilesByDay;
}
async function getWorkflowRuns(owner: string, repo: string) {
  
  const response = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 100,
  });

  return response.data.workflow_runs;
}


function calculateTimeDifferenceInHours(created_at: string, updated_at: string): number {
  const createdDate = new Date(created_at);
  const updatedDate = new Date(updated_at);

  // Calculate the time difference in milliseconds
  const timeDifference = updatedDate.getTime() - createdDate.getTime();

  const minutesDifference = timeDifference / (1000 * 60);

  return minutesDifference;
}

