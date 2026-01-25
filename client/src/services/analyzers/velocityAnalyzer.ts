import { ProcessedCommit } from '../../types';

export const VelocityAnalyzer = {
  analyze(commits: ProcessedCommit[]) {
    const commitsByDay: Record<string, number> = {};
    commits.forEach(c => {
      const day = c.date.split(' ')[0];
      commitsByDay[day] = (commitsByDay[day] || 0) + 1;
    });

    const velocitySeries = Object.keys(commitsByDay).sort().map(date => ({
      date,
      count: commitsByDay[date]
    }));

    return { velocitySeries };
  }
};
