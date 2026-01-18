import { subDays } from 'date-fns';

export const AnalysisService = {
  analyze(commits) {
    // Transform isomorphic-git commits to our format
    // commit.author.timestamp is seconds since epoch
    const processedCommits = commits.map(c => {
        const date = new Date(c.commit.author.timestamp * 1000);
        // Format YYYY-MM-DD HH:mm:ss
        const dateStr = date.toISOString().replace('T', ' ').substring(0, 19);

        return {
            hash: c.oid,
            author: c.commit.author.name,
            email: c.commit.author.email,
            date: dateStr,
            subject: c.commit.message.split('\n')[0], // First line of message
            message: c.commit.message,
            files: [], // Not available efficiently in basic log
            additions: 0,
            deletions: 0
        };
    });

    return this.calculateMetrics(processedCommits);
  },

  calculateMetrics(commits) {
    // 1. Velocity (Commits per week/day)
    const commitsByDay = {};

    // New Metrics Aggregation
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

    // Process Monthly Activity
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

    // 4. Hotspots (Files modified most often)
    // Stubbed for now as file stats are expensive
    const hotspots = [];

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
};
