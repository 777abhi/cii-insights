import { Octokit } from 'octokit';

// Create an Octokit instance by providing your GitHub personal access token or authentication method.
const octokit = new Octokit({
  auth: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN',
});

async function getContributorInsights(owner: string, repo: string) {
  try {
    // Retrieve the list of contributors to the repository.
    const { data: contributors } = await octokit.rest.repos.listContributors({
      owner,
      repo,
    });

    const contributorData = [];
    
    for (const contributor of contributors) {
      // Fetch additional contributor details (e.g., pull request data).
      const { data: pullRequests } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'all', // 'all' includes both open and closed pull requests
        creator: contributor.login,
      });

      const numPullRequests = pullRequests.length;

      contributorData.push({
        Contributor: contributor.login,
        Commits: contributor.contributions,
        PullRequests: numPullRequests,
      });
    }

    // Display the data as a console table.
    console.table(contributorData);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Replace 'OWNER' and 'REPO' with your GitHub repository's owner and name.
getContributorInsights('OWNER', 'REPO');
