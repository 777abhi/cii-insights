import { Octokit } from "octokit";

// Initialize the Octokit instance
const octokit = new Octokit({
  auth: "YOUR_GITHUB_TOKEN", // Replace with your GitHub token
});

async function calculatePullRequestMetrics(owner: string, repo: string) {
  try {
    // Get the list of pull requests for the repository
    const pullRequests = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all", // You can adjust the state as needed
    });

    const totalPullRequests = pullRequests.data.length;
    let mergedPullRequests = 0;
    let totalMergeTime = 0;
    let totalLeadTime = 0;

    for (const pr of pullRequests.data) {
      if (pr.merged_at) {
        mergedPullRequests++;
        const createdAt = new Date(pr.created_at);
        const mergedAt = new Date(pr.merged_at);

        // Calculate the time to merge in hours
        const timeToMergeHours = (mergedAt.getTime() - createdAt.getTime()) / 3600000;
        totalMergeTime += timeToMergeHours;

        // Calculate the lead time in hours
        const leadTimeHours = (mergedAt.getTime() - createdAt.getTime()) / 3600000;
        totalLeadTime += leadTimeHours;
      }
    }

    // Calculate the average time to merge in hours
    const avgTimeToMerge = totalMergeTime / mergedPullRequests;

    // Calculate the pull request acceptance rate
    const acceptanceRate = (mergedPullRequests / totalPullRequests) * 100;

    // Calculate the average lead time in hours
    const avgLeadTime = totalLeadTime / mergedPullRequests;

    console.log("Pull Request Metrics:");
    console.log(`Average Time to Merge (hours): ${avgTimeToMerge}`);
    console.log(`Pull Request Acceptance Rate: ${acceptanceRate}%`);
    console.log(`Average Lead Time (hours): ${avgLeadTime}`);
  } catch (error) {
    console.error("Error calculating pull request metrics:", error);
  }
}

// Replace with your GitHub repository owner and repo name
const owner = "your_owner";
const repo = "your_repo";

calculatePullRequestMetrics(owner, repo);
