const simpleGit = require('simple-git');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const { subDays } = require('date-fns');

// --- Metric Calculation Logic ---
function calculateMetrics(commits) {
    // 1. Velocity (Commits per week/day)
    const commitsByDay = {};
    const authorStats = {}; // { authorEmail: { name, email, commits, additions, deletions } }
    const monthlyAuthorStats = {}; // { "YYYY-MM": { authorEmail: count } }

    commits.forEach(c => {
        // 1. Velocity
        const day = c.date.split(' ')[0];
        commitsByDay[day] = (commitsByDay[day] || 0) + 1;

        // Author Stats
        const authorKey = c.email || c.author;
        if (!authorStats[authorKey]) {
            authorStats[authorKey] = {
                name: c.author,
                email: c.email,
                commits: 0,
                additions: 0,
                deletions: 0
            };
        }
        authorStats[authorKey].commits++;
        authorStats[authorKey].additions += (c.additions || 0);
        authorStats[authorKey].deletions += (c.deletions || 0);

        // Monthly Activity
        const month = c.date.substring(0, 7); // YYYY-MM
        if (!monthlyAuthorStats[month]) {
            monthlyAuthorStats[month] = {};
        }
        monthlyAuthorStats[month][authorKey] = (monthlyAuthorStats[month][authorKey] || 0) + 1;
    });

    const velocitySeries = Object.keys(commitsByDay).sort().map(date => ({
        date,
        count: commitsByDay[date]
    }));

    // Process Author Stats for response (Top 10)
    const topContributors = Object.values(authorStats)
        .sort((a, b) => b.commits - a.commits)
        .slice(0, 10);

    const top5Authors = topContributors.slice(0, 5).map(a => a.email || a.name);
    const authorMonthlyActivity = Object.keys(monthlyAuthorStats).sort().map(month => {
        const entry = { date: month };
        top5Authors.forEach(authKey => {
            const authName = authorStats[authKey]?.name || authKey;
            entry[authName] = monthlyAuthorStats[month][authKey] || 0;
        });
        return entry;
    });

    // 2. Quality (Message Score)
    const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?: .+$/;
    let goodCommits = 0;
    commits.forEach(c => {
        if (conventionalRegex.test(c.subject)) {
            goodCommits++;
        }
    });
    const qualityScore = commits.length > 0 ? Math.round((goodCommits / commits.length) * 100) : 0;

    // 3. Churn (Rolling 30 days)
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

    // 4. Hotspots
    const fileCounts = {};
    commits.forEach(c => {
        if (c.files) {
            c.files.forEach(f => {
                const fname = f.path || f; // handle object or string
                fileCounts[fname] = (fileCounts[fname] || 0) + 1;
            });
        }
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
        velocitySeries,
        qualityScore,
        churn: { added: churnAdded, deleted: churnDeleted },
        hotspots,
        commitTypes,
        recentCommits: commits.slice(0, 10),
        topContributors,
        authorMonthlyActivity
    };
}

// --- Simple Git Provider ---
class SimpleGitProvider {
    async prepareRepo(url, localPath, branch) {
        const gitInstance = simpleGit();
        if (fs.existsSync(localPath)) {
            console.log(`Repository exists. Pulling latest changes (SimpleGit)...`);
            try {
                 // Check if it is a git repo
                if (!fs.existsSync(path.join(localPath, '.git'))) {
                     console.log('Folder exists but not a git repo. Cleaning up and cloning...');
                     fs.rmSync(localPath, { recursive: true, force: true });
                     await gitInstance.clone(url, localPath);
                     await simpleGit(localPath).checkout(branch);
                     return;
                }

                await simpleGit(localPath).fetch();
                try {
                    await simpleGit(localPath).checkout(branch);
                    await simpleGit(localPath).pull();
                } catch (e) {
                    console.log(`Checkout failed, trying to checkout remote branch ${branch}`);
                    await simpleGit(localPath).checkout(['-t', `origin/${branch}`]);
                    await simpleGit(localPath).pull();
                }
            } catch (e) {
                console.error('Error in prepareRepo:', e);
                throw e;
            }
        } else {
            console.log(`Cloning ${url} to ${localPath} (SimpleGit)...`);
            await gitInstance.clone(url, localPath);
            await simpleGit(localPath).checkout(branch);
        }
    }

    async getMetrics(localPath, branch) {
        const repoGit = simpleGit(localPath);
        const logOptions = [
            branch,
            `--pretty=format:COMMIT::%H::%an::%ae::%ad::%s`,
            '--stat',
            '--max-count=2000',
            '--date=iso'
        ];

        const logOutput = await repoGit.raw(['log', ...logOptions]);
        const commits = this.parseLogText(logOutput);
        return calculateMetrics(commits);
    }

    parseLogText(logOutput) {
        const lines = logOutput.split('\n');
        const commits = [];
        let currentCommit = null;
        const commitRegex = /^COMMIT::([a-f0-9]+)::(.+)::(.+)::(.+)::(.+)$/;

        for (const line of lines) {
            const match = line.match(commitRegex);
            if (match) {
                if (currentCommit) commits.push(currentCommit);
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
                const fileStatRegex = /^ (.+) \| (\d+) (.+)$/;
                const fileMatch = line.match(fileStatRegex);
                if (fileMatch) {
                    currentCommit.files.push({
                        path: fileMatch[1].trim(),
                        changes: parseInt(fileMatch[2], 10)
                    });
                } else {
                    if (line.includes('changed') && (line.includes('insertion') || line.includes('deletion'))) {
                        const insertionsMatch = line.match(/(\d+) insertion/);
                        const deletionsMatch = line.match(/(\d+) deletion/);
                        if (insertionsMatch) currentCommit.additions = parseInt(insertionsMatch[1], 10);
                        if (deletionsMatch) currentCommit.deletions = parseInt(deletionsMatch[1], 10);
                    }
                }
            }
        }
        if (currentCommit) commits.push(currentCommit);
        return commits;
    }
}

// --- Isomorphic Git Provider ---
class IsoGitProvider {
    async prepareRepo(url, localPath, branch) {
        if (!fs.existsSync(localPath)) {
            fs.mkdirSync(localPath, { recursive: true });
            console.log(`Cloning ${url} to ${localPath} (IsoGit)...`);
            await git.clone({
                fs,
                http,
                dir: localPath,
                url,
                ref: branch,
                singleBranch: true,
                depth: 50 // Reduce depth for mobile performance
            });
        } else {
            console.log(`Pulling ${url} in ${localPath} (IsoGit)...`);
            // Basic pull: fetch + merge. For simplicity, just fetch and checkout/reset or pull.
            // git.pull is available
            try {
                await git.pull({
                    fs,
                    http,
                    dir: localPath,
                    ref: branch,
                    singleBranch: true,
                    author: { name: 'QE Analytics', email: 'bot@qeanalytics.com' }
                });
            } catch (e) {
                console.error("Pull failed, might need manual merge resolution. Re-cloning for safety in mobile.", e);
                // In mobile, safe to re-clone if stuck
                fs.rmSync(localPath, { recursive: true, force: true });
                fs.mkdirSync(localPath, { recursive: true });
                await git.clone({
                    fs,
                    http,
                    dir: localPath,
                    url,
                    ref: branch,
                    singleBranch: true,
                    depth: 50
                });
            }
        }
    }

    async getMetrics(localPath, branch) {
        const commits = await git.log({
            fs,
            dir: localPath,
            ref: branch,
            depth: 50 // Limit depth for performance
        });

        // Convert to our format
        const formattedCommits = [];
        for (const c of commits) {
            const comm = c.commit;
            const date = new Date(comm.author.timestamp * 1000).toISOString().replace('T', ' ').substring(0, 19);

            // To get files/stats, we need to diff with parent.
            // This is expensive in pure JS for many commits.
            // For now, we will SKIP file stats in IsoGitProvider to ensure responsiveness on mobile.
            // Or implement a very simple file list if needed.

            // We can assume 0 additions/deletions if we skip diffing.
            // Churn and Hotspots will be empty, but Velocity and Quality will work.

            formattedCommits.push({
                hash: c.oid,
                author: comm.author.name,
                email: comm.author.email,
                date: date,
                subject: comm.message.split('\n')[0],
                files: [], // Skip files for performance
                additions: 0,
                deletions: 0
            });
        }

        return calculateMetrics(formattedCommits);
    }
}

// --- Factory ---
const getProvider = () => {
    const forceIso = process.env.USE_ISO_GIT === 'true';
    if (forceIso) {
        console.log('Using IsoGitProvider');
        return new IsoGitProvider();
    }

    // Check if git is available
    try {
        const { execSync } = require('child_process');
        execSync('git --version');
        return new SimpleGitProvider();
    } catch (e) {
        console.log('Git binary not found, falling back to IsoGitProvider');
        return new IsoGitProvider();
    }
};

module.exports = {
    getProvider,
    calculateMetrics
};
