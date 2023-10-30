import { Octokit } from "octokit";
import { DateTime } from "luxon";

// Initialize Octokit with your GitHub personal access token
const octokit = new Octokit({
  auth: "xx",
});

// Function to fetch Pull Requests from a specific repository
async function fetchPullRequests(owner: string, repo: string): Promise<any[]> {
  const pullRequests: any[] = [];
  let page = 1;
  let response;

  // Fetch all pages of Pull Requests
  do {
    response = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all", // You can change this to 'open' or 'closed' as needed
      per_page: 100, // Adjust the per_page value according to your needs
      page,
    });

    pullRequests.push(...response.data);

    page++;
  } while (response.data.length > 0);

  return pullRequests;
}

// Function to fetch reviews for a specific Pull Request
async function fetchReviews(
  owner: string,
  repo: string,
  pullRequestNumber: number
): Promise<any[]> {
  const reviews: any[] = [];
  let page = 1;
  let response;

  // Fetch all pages of reviews
  do {
    response = await octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: pullRequestNumber,
      per_page: 100, // Adjust the per_page value according to your needs
      page,
    });

    reviews.push(...response.data);

    page++;
  } while (response.data.length > 0);

  return reviews;
}

// Main function to perform the analysis
async function analyzeGitHubData(owner: string, repo: string) {
  const pullRequests = await fetchPullRequests(owner, repo);

  // Loop through Pull Requests and fetch reviews
  for (const pr of pullRequests) {
    console.log("Pull Request url:", pr.url);
    console.log("Pull Request login:", pr.user.login);

    const reviews = await fetchReviews(owner, repo, pr.number);
    console.log("Reviews for Pull Request", pr.number, ":");
    for (const review of reviews) {
      console.log("Review url:", review.state);
      console.log("review login:", review.user.login);
    }
  }
}

async function getCommitStats(owner: string, repo: string) {
  const response = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  const commitStats: { [key: string]: number } = {}; // To store commit counts by committer email and month

  response.data.forEach((commit) => {
    const committerEmail = commit.commit?.author?.email;
    const commitDate = DateTime.fromISO(String(commit.commit?.author?.date));

    // Create a unique key for each month and committer email
    const key = `${commitDate.toFormat("yyyy-MM")}_${committerEmail}`;

    if (commitStats[key]) {
      commitStats[key]++;
    } else {
      commitStats[key] = 1;
    }
  });

  return commitStats;
}

// Replace 'YOUR_PERSONAL_ACCESS_TOKEN' with your GitHub personal access token
const OWNER = "xx";
const REPO = "xx";

//analyzeGitHubData(OWNER, REPO);

getCommitStats(OWNER, REPO)
  .then((commitStats) => {
    console.log(commitStats);
  })
  .catch((error) => {
    console.error(error);
  });
