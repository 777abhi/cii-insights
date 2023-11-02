import { Octokit } from 'octokit';

// Create an Octokit instance by providing your GitHub personal access token or authentication method.
const octokit = new Octokit({
  auth: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN',
});

async function getCommitAnalysis(owner: string, repo: string) {
  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
    });

    const commitMetrics = commits.map((commit) => ({
      Committer: commit.committer.login,
      CommitDate: commit.commit.committer.date,
      CommitMessage: commit.commit.message,
    }));

    console.log('Commit Analysis:');
    console.table(commitMetrics);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Replace 'OWNER' and 'REPO' with your GitHub repository's owner and name.
getCommitAnalysis('OWNER', 'REPO');
