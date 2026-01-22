import { subDays } from 'date-fns';
import { ProcessedCommit } from '../../types';

export const ChurnAnalyzer = {
  analyze(commits: ProcessedCommit[]) {
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
