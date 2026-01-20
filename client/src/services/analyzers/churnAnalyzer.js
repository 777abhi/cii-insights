import { subDays } from 'date-fns';

export const ChurnAnalyzer = {
  analyze(commits) {
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
