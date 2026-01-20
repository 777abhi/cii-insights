export const ContributorAnalyzer = {
  analyze(commits) {
    const authorStats = {};
    const monthlyAuthorStats = {};

    commits.forEach(c => {
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

      const month = c.date.substring(0, 7);
      if (!monthlyAuthorStats[month]) {
        monthlyAuthorStats[month] = {};
      }
      monthlyAuthorStats[month][authorKey] = (monthlyAuthorStats[month][authorKey] || 0) + 1;
    });

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

    return { topContributors, authorMonthlyActivity };
  }
};
