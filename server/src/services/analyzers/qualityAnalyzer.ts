import { Commit } from '../../types';

export default {
  analyze(commits: Commit[]) {
    const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?: .+$/;
    let goodCommits = 0;
    commits.forEach(c => {
      if (conventionalRegex.test(c.subject)) {
        goodCommits++;
      }
    });
    const qualityScore = commits.length > 0 ? Math.round((goodCommits / commits.length) * 100) : 0;
    return { qualityScore };
  }
};
