import { ProcessedCommit } from '../../types';

export const CommitTypeAnalyzer = {
  analyze(commits: ProcessedCommit[]) {
    const typeCounts: Record<string, number> = {
      feat: 0, fix: 0, chore: 0, other: 0
    };
    commits.forEach(c => {
      const match = c.subject.match(/^([a-z]+)(\(.*\))?:/);
      if (match) {
        const type = match[1];
        if (['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test'].includes(type)) {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        } else {
          typeCounts['other'] = (typeCounts['other'] || 0) + 1;
        }
      } else {
        typeCounts['other'] = (typeCounts['other'] || 0) + 1;
      }
    });

    const commitTypes = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
    return { commitTypes };
  }
};
