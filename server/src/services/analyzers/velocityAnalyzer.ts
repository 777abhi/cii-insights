import { Commit } from '../../types';

export default {
  analyze(commits: Commit[]) {
    const commitsByDay: Record<string, number> = {};
    commits.forEach(c => {
      const day = c.date.split('T')[0]; // server dates are ISO with T
      commitsByDay[day] = (commitsByDay[day] || 0) + 1;
    });

    const velocitySeries = Object.keys(commitsByDay).sort().map(date => ({
      date,
      count: commitsByDay[date]
    }));

    return { velocitySeries };
  }
};
