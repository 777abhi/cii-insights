import { subDays } from 'date-fns';
import { Commit } from '../../types';

export default {
  analyze(commits: Commit[]) {
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

    return { churn: { added: churnAdded, deleted: churnDeleted } };
  }
};
