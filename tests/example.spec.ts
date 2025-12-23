import { expect, test } from "@playwright/test";

test("API - GitHub (mocked)", async () => {
  const mockRuns = [
    {
      created_at: "2024-01-02T10:00:00Z",
      updated_at: "2024-01-02T11:30:00Z",
      head_commit: { author: { email: "dev1@example.com" } },
    },
    {
      created_at: "2024-01-02T12:00:00Z",
      updated_at: "2024-01-02T12:20:00Z",
      head_commit: { author: { email: "dev2@example.com" } },
    },
    {
      created_at: "2024-02-05T09:00:00Z",
      updated_at: "2024-02-05T10:00:00Z",
      head_commit: { author: { email: "dev1@example.com" } },
    },
  ];

  const uniqueCommitersCount = await getUniqueCommitersCount(mockRuns);
  expect(uniqueCommitersCount).toEqual([
    { date: "2024-Jan", commiters: ["dev1@example.com", "dev2@example.com"], count: 2 },
    { date: "2024-Feb", commiters: ["dev1@example.com"], count: 1 },
  ]);

  const percentilesByDay = await calculatePercentileByDay(mockRuns);
  expect(percentilesByDay).toEqual({
    "2Jan2024": 90, // 90th percentile of [90, 20] minutes is 90
    "5Feb2024": 60,
  });
});

export async function getUniqueCommitersCount(workflowRuns: any[]) {
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


export function calculatePercentile(data: number[], percentileValue: number) {
  const sortedData = data.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sortedData.length) - 1;
  return sortedData[index];
}

export async function calculatePercentileByDay(runs: any[]) {
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

export function calculateTimeDifferenceInHours(created_at: string, updated_at: string): number {
  const createdDate = new Date(created_at);
  const updatedDate = new Date(updated_at);

  // Calculate the time difference in milliseconds
  const timeDifference = updatedDate.getTime() - createdDate.getTime();

  const minutesDifference = timeDifference / (1000 * 60);

  return minutesDifference;
}
