import { Octokit } from '@octokit/rest';

async function calculateCodeCommitMetrics() {
  const octokit = new Octokit({
    auth: 'YOUR_GITHUB_TOKEN', // Replace with your GitHub personal access token
  });

  const owner = 'your_username';
  const repo = 'your_repository';

  const today = new Date();
  const sixMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 6));
  const months = Array.from({ length: 6 }, (_, i) => {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    return { start: monthStart.toISOString(), end: monthEnd.toISOString() };
  });

  console.log('| Month | Total Commits | Commit Frequency | Code Churn |');
  console.log('|-------|---------------|------------------|------------|');

  for (const { start, end } of months) {
    const commitResponse = await octokit.repos.listCommits({
      owner,
      repo,
      since: start,
      until: end,
    });

    const commitCount = commitResponse.data.length;

    // Calculate commit frequency (Commits per day)
    const daysInRange = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24);
    const commitFrequency = (commitCount / daysInRange).toFixed(2);

    // Calculate code churn for each month
    const codeChurnResponse = await octokit.repos.listCommits({
      owner,
      repo,
      since: start,
      until: end,
    });
    let codeChurn = 0;
    codeChurnResponse.data.forEach((commit) => {
      codeChurn += commit.stats.additions + commit.stats.deletions;
    });

    console.log(`| ${start.substr(0, 7)} | ${commitCount} | ${commitFrequency} | ${codeChurn} |`);
  }
}

calculateCodeCommitMetrics();
