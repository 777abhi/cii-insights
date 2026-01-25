import { subDays } from 'date-fns';
import { ProcessedCommit } from '../../types';

export const ChurnAnalyzer = {
  analyze(commits: ProcessedCommit[]) {
    const thirtyDaysAgo = subDays(new Date(), 30);
    let churnAdded = 0;
    let churnDeleted = 0;
    const trendMap: Record<string, { date: string; added: number; deleted: number }> = {};

    commits.forEach(c => {
      const commitDate = new Date(c.date.replace(' ', 'T'));
      if (commitDate >= thirtyDaysAgo) {
        churnAdded += c.additions;
        churnDeleted += c.deletions;
      }

      // Trend Calculation
      const dateKey = c.date.substring(0, 10);
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { date: dateKey, added: 0, deleted: 0 };
      }
      trendMap[dateKey].added += (c.additions || 0);
      trendMap[dateKey].deleted += (c.deletions || 0);
    });

    const churnTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      churn: { added: churnAdded, deleted: churnDeleted },
      churnTrend
    };
  }
};
