import { Octokit } from 'octokit';

// Create an Octokit instance by providing your GitHub personal access token or authentication method.
const octokit = new Octokit({
  auth: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN',
});

async function getCodeReviewInsights(owner: string, repo: string) {
  try {
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all', // 'all' includes both open and closed pull requests
    });

    const openPullRequests = pullRequests.filter((pr) => pr.state === 'open');

    const reviewInsights = openPullRequests.map(async (pr) => {
      const { data: reviews } = await octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: pr.number,
      });

      const reviewComments = reviews.map((review) => ({
        PR_Title: pr.title,
        Reviewer: review.user.login,
        State: review.state,
        Comments: review.body,
      }));

      return reviewComments;
    });

    const reviewComments = await Promise.all(reviewInsights);
    const flattenedComments = reviewComments.flat();

    console.log('Code Review Insights:');
    console.table(flattenedComments);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Replace 'OWNER' and 'REPO' with your GitHub repository's owner and name.
getCodeReviewInsights('OWNER', 'REPO');


import { Octokit } from 'octokit';

// Create an Octokit instance by providing your GitHub personal access token or authentication method.
const octokit = new Octokit({
  auth: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN',
});

async function getPRMetrics(owner: string, repo: string) {
  try {
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all', // 'all' includes both open and closed pull requests
    });

    const prMetrics = [];

    for (const pr of pullRequests) {
      const timeToClose = pr.closed_at
        ? (new Date(pr.closed_at).getTime() - new Date(pr.created_at).getTime()) / 3600000 // Convert to hours
        : null;

      const { data: reviews } = await octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: pr.number,
      });

      prMetrics.push({
        Title: pr.title,
        State: pr.state,
        TimeToClose: timeToClose,
        ReviewCount: reviews.length,
      });
    }

    console.log('Pull Request Metrics:');
    console.table(prMetrics);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Replace 'OWNER' and 'REPO' with your GitHub repository's owner and name.
getPRMetrics('OWNER', 'REPO');

