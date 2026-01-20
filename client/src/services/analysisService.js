import { VelocityAnalyzer } from './analyzers/velocityAnalyzer';
import { QualityAnalyzer } from './analyzers/qualityAnalyzer';
import { ChurnAnalyzer } from './analyzers/churnAnalyzer';
import { HotspotAnalyzer } from './analyzers/hotspotAnalyzer';
import { ContributorAnalyzer } from './analyzers/contributorAnalyzer';
import { CommitTypeAnalyzer } from './analyzers/commitTypeAnalyzer';

const analyzers = [
    VelocityAnalyzer,
    QualityAnalyzer,
    ChurnAnalyzer,
    HotspotAnalyzer,
    ContributorAnalyzer,
    CommitTypeAnalyzer
];

export const AnalysisService = {
  analyze(commits) {
    // Transform isomorphic-git commits to our format
    const processedCommits = commits.map(c => {
        const date = new Date(c.commit.author.timestamp * 1000);
        // Format YYYY-MM-DD HH:mm:ss
        const dateStr = date.toISOString().replace('T', ' ').substring(0, 19);

        return {
            hash: c.oid,
            author: c.commit.author.name,
            email: c.commit.author.email,
            date: dateStr,
            subject: c.commit.message.split('\n')[0], // First line of message
            message: c.commit.message,
            files: [], // Not available efficiently in basic log
            additions: 0,
            deletions: 0
        };
    });

    return this.calculateMetrics(processedCommits);
  },

  calculateMetrics(commits) {
    const results = {
      totalCommits: commits.length,
      recentCommits: commits.slice(0, 10),
    };

    analyzers.forEach(analyzer => {
        Object.assign(results, analyzer.analyze(commits));
    });

    return results;
  }
};
