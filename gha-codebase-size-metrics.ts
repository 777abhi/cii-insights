import { Octokit } from 'octokit';

// Create an Octokit instance by providing your GitHub personal access token or authentication method.
const octokit = new Octokit({
  auth: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN',
});

async function getCodebaseSize(owner: string, repo: string, branch: string) {
  try {
    // Fetch the code tree for the specified branch
    const { data: codeTree } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 1,
    });

    const codebaseMetrics = codeTree.tree
      .filter((item) => item.type === 'blob') // Filter out only files, not directories
      .map((file) => ({
        FileName: file.path,
        Size: file.size,
      }));

    console.log('Codebase Size Analysis:');
    console.table(codebaseMetrics);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Replace 'OWNER' and 'REPO' with your GitHub repository's owner and name.
// Replace 'BRANCH' with the branch you want to analyze.
getCodebaseSize('OWNER', 'REPO', 'BRANCH');
