import { ProcessedCommit } from '../../types';

export const ContributorAnalyzer = {
  analyze(commits: ProcessedCommit[]) {
    const authorStats: Record<string, any> = {};
    const monthlyAuthorStats: Record<string, Record<string, number>> = {};
    const moduleStats: Record<string, Record<string, number>> = {};

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

      // Module analysis for Knowledge Distribution
      if (c.files && c.files.length > 0) {
        c.files.forEach(f => {
          const pathParts = f.path.split('/');
          let moduleName = pathParts.length > 1 ? pathParts[0] : 'root';

          // Refine module name for monorepos or standard structures
          if (['src', 'lib', 'packages', 'client', 'server', 'apps'].includes(moduleName) && pathParts.length > 1) {
             moduleName = `${moduleName}/${pathParts[1]}`;
             // If second level is also generic (e.g. client/src), go one deeper
             if (['src', 'lib'].includes(pathParts[1]) && pathParts.length > 2) {
                moduleName = `${moduleName}/${pathParts[2]}`;
             }
          }

          if (!moduleStats[moduleName]) {
            moduleStats[moduleName] = {};
          }
          moduleStats[moduleName][authorKey] = (moduleStats[moduleName][authorKey] || 0) + 1;
        });
      }
    });

    const topContributors = Object.values(authorStats)
      .sort((a: any, b: any) => b.commits - a.commits)
      .slice(0, 10);

    const top5Authors = topContributors.slice(0, 5).map((a: any) => a.email || a.name);
    const authorMonthlyActivity = Object.keys(monthlyAuthorStats).sort().map(month => {
      const entry: any = { date: month };
      top5Authors.forEach(authKey => {
        const authName = authorStats[authKey]?.name || authKey;
        entry[authName] = monthlyAuthorStats[month][authKey] || 0;
      });
      return entry;
    });

    // Knowledge Distribution (Radar Chart Data)
    const moduleActivityCounts = Object.entries(moduleStats).map(([name, authors]) => {
      const total = Object.values(authors).reduce((a, b) => a + b, 0);
      return { name, total };
    }).sort((a, b) => b.total - a.total).slice(0, 6);

    const knowledgeDistribution = moduleActivityCounts.map(m => {
      const entry: any = { subject: m.name, fullMark: m.total };
      top5Authors.forEach(authKey => {
        const authName = authorStats[authKey]?.name || authKey;
        entry[authName] = moduleStats[m.name][authKey] || 0;
      });
      return entry;
    });

    return { topContributors, authorMonthlyActivity, knowledgeDistribution };
  }
};
