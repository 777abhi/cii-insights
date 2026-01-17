const express = require('express');
const cors = require('cors');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { parseISO, format, startOfWeek, subDays } = require('date-fns');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const REPO_DIR = path.join(__dirname, 'repos');

if (!fs.existsSync(REPO_DIR)) {
  fs.mkdirSync(REPO_DIR);
}

// Utility to sanitize folder name from URL
function getRepoName(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].replace('.git', '');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', async (req, res) => {
  const { repoUrl, branch = 'main' } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  const repoName = getRepoName(repoUrl);
  const localPath = path.join(REPO_DIR, repoName);
  const git = simpleGit();

  try {
    // Clone or Pull
    if (fs.existsSync(localPath)) {
      console.log(`Repository ${repoName} exists. Pulling latest changes...`);
      await simpleGit(localPath).fetch();
      try {
        await simpleGit(localPath).checkout(branch);
        await simpleGit(localPath).pull();
      } catch (e) {
        // If branch checkout fails (e.g. branch doesn't exist locally yet), try checkout with origin
        console.log(`Checkout failed, trying to checkout remote branch ${branch}`);
        await simpleGit(localPath).checkout(['-t', `origin/${branch}`]);
        await simpleGit(localPath).pull();
      }
    } else {
      console.log(`Cloning ${repoUrl} to ${localPath}...`);
      await git.clone(repoUrl, localPath);
      await simpleGit(localPath).checkout(branch);
    }

    // Initialize git instance for the repo
    const repoGit = simpleGit(localPath);

    // Get Git Log
    // Format: Hash | Author Name | Author Email | Date | Subject
    // We also want --stat for churn
    const logOptions = [
      branch,
      `--pretty=format:COMMIT::%H::%an::%ae::%ad::%s`,
      '--stat',
      '--max-count=2000', // Limit to last 2000 commits for performance
      '--date=iso'
    ];

    const logOutput = await repoGit.raw(['log', ...logOptions]);

    const metrics = parseGitLog(logOutput);

    res.json({
      repo: repoName,
      branch,
      ...metrics
    });

  } catch (error) {
    console.error('Error processing repository:', error);
    res.status(500).json({ error: error.message });
  }
});

function parseGitLog(logOutput) {
  const lines = logOutput.split('\n');
  const commits = [];
  let currentCommit = null;

  const commitRegex = /^COMMIT::([a-f0-9]+)::(.+)::(.+)::(.+)::(.+)$/;

  for (const line of lines) {
    const match = line.match(commitRegex);
    if (match) {
      if (currentCommit) {
        commits.push(currentCommit);
      }
      currentCommit = {
        hash: match[1],
        author: match[2],
        email: match[3],
        date: match[4],
        subject: match[5],
        files: [],
        additions: 0,
        deletions: 0
      };
    } else if (currentCommit) {
      // Parse stat lines
      // Example:  src/index.js | 10 +++++-----
      // Example:  2 files changed, 5 insertions(+), 5 deletions(-)
      const fileStatRegex = /^ (.+) \| (\d+) (.+)$/;
      const summaryRegex = / (\d+) file(s)? changed, (\d+) insertion(s)?\(\+\)(, (\d+) deletion(s)?\(-\))?/;
      const summaryRegexSimple = / (\d+) file(s)? changed, (\d+) deletion(s)?\(-\)/; // Case with only deletions

      const fileMatch = line.match(fileStatRegex);
      if (fileMatch) {
        // It's a file line
        currentCommit.files.push({
          path: fileMatch[1].trim(),
          changes: parseInt(fileMatch[2], 10)
        });
      } else {
          // Check for summary line (usually last line of commit block)
          // We can calculate total additions/deletions from file lines if summary regex is tricky or parse summary directly.
          // Let's parse summary for validation or just rely on file lines?
          // Actually, '10 +++++-----' in file line gives total changes, not split.
          // Wait, 'git log --stat' output:
          // file | changes +++---
          // The number is total changes (add + del). The + and - show ratio.
          // BUT the summary line at bottom: " 1 file changed, 1 insertion(+), 1 deletion(-)" is exact.
          // However, summary line is per commit.

          // Let's rely on the summary line for exact addition/deletion counts per commit if possible.
          // But it's easier to just sum up files if we want hotspots.
          // For Churn (add vs del), we really need the summary line.

          if (line.includes('changed') && (line.includes('insertion') || line.includes('deletion'))) {
             // Parse summary
             // " 2 files changed, 10 insertions(+), 5 deletions(-)"
             const insertionsMatch = line.match(/(\d+) insertion/);
             const deletionsMatch = line.match(/(\d+) deletion/);

             if (insertionsMatch) currentCommit.additions = parseInt(insertionsMatch[1], 10);
             if (deletionsMatch) currentCommit.deletions = parseInt(deletionsMatch[1], 10);
          }
      }
    }
  }
  if (currentCommit) {
    commits.push(currentCommit);
  }

  // --- Calculate Metrics ---

  // 1. Velocity (Commits per week/day) - let's do simple daily buckets for the chart
  const commitsByDay = {};
  commits.forEach(c => {
    // git log --date=iso output example: "2020-09-20 14:00:00 -0700"
    const day = c.date.split(' ')[0];
    commitsByDay[day] = (commitsByDay[day] || 0) + 1;
  });

  const velocitySeries = Object.keys(commitsByDay).sort().map(date => ({
    date,
    count: commitsByDay[date]
  }));

  // 2. Quality (Message Score)
  const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?: .+$/;
  let goodCommits = 0;
  commits.forEach(c => {
    if (conventionalRegex.test(c.subject)) {
      goodCommits++;
    }
  });
  const qualityScore = commits.length > 0 ? Math.round((goodCommits / commits.length) * 100) : 0;

  // 3. Churn (Rolling 30 days) - for MVP just total in the log period (limited to 2000 commits)
  // or filtered by date. Let's filter last 30 days.
  const thirtyDaysAgo = subDays(new Date(), 30);
  let churnAdded = 0;
  let churnDeleted = 0;

  commits.forEach(c => {
    const commitDate = new Date(c.date);
    if (commitDate >= thirtyDaysAgo) {
      churnAdded += c.additions;
      churnDeleted += c.deletions;
    }
  });

  // 4. Hotspots (Files modified most often)
  const fileCounts = {};
  commits.forEach(c => {
    c.files.forEach(f => {
      // Remove "..." if present (git stat truncates sometimes)
      const fname = f.path;
      fileCounts[fname] = (fileCounts[fname] || 0) + 1;
    });
  });

  const hotspots = Object.entries(fileCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // 5. Commit Type Breakdown
  const typeCounts = {
      feat: 0, fix: 0, chore: 0, other: 0
  };
  commits.forEach(c => {
      const match = c.subject.match(/^([a-z]+)(\(.*\))?:/);
      if (match) {
          const type = match[1];
          if (['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test'].includes(type)) {
              typeCounts[type] = (typeCounts[type] || 0) + 1;
          } else {
              typeCounts.other++;
          }
      } else {
          typeCounts.other++;
      }
  });

  const commitTypes = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  return {
    totalCommits: commits.length,
    velocitySeries, // Line chart
    qualityScore,   // Single Value
    churn: { added: churnAdded, deleted: churnDeleted }, // Bar chart or stats
    hotspots,       // Bar chart
    commitTypes,    // Pie chart
    recentCommits: commits.slice(0, 10) // List
  };
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
