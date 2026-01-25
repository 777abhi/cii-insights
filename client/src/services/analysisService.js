import { VelocityAnalyzer } from './analyzers/velocityAnalyzer';
import { QualityAnalyzer } from './analyzers/qualityAnalyzer';
import { ChurnAnalyzer } from './analyzers/churnAnalyzer';
import { HotspotAnalyzer } from './analyzers/hotspotAnalyzer';
import { ContributorAnalyzer } from './analyzers/contributorAnalyzer';
import { CommitTypeAnalyzer } from './analyzers/commitTypeAnalyzer';
import { WorkPatternAnalyzer } from './analyzers/workPatternAnalyzer';

const analyzers = [
  VelocityAnalyzer,
  QualityAnalyzer,
  ChurnAnalyzer,
  HotspotAnalyzer,
  ContributorAnalyzer,
  CommitTypeAnalyzer,
  WorkPatternAnalyzer
];

export const AnalysisService = {
  async analyze(commits, onProgress) {
    // Transform isomorphic-git commits to our format
    const processedCommits = commits.map(c => {
      // Fix Heatmap: Parse date using author's timezone offset
      // commit.author.timestamp is seconds since epoch (UTC)
      // commit.author.timezoneOffset is minutes offset from UTC
      const timestamp = c.commit.author.timestamp * 1000;
      const offsetMinutes = c.commit.author.timezoneOffset;

      // Shift time so it looks like local time in UTC/ISO string
      // e.g. 15:00 Tokyo -> 15:00 in string
      const localTime = new Date(timestamp - (offsetMinutes * 60 * 1000));
      const dateStr = localTime.toISOString().replace('T', ' ').substring(0, 19);

      return {
        hash: c.oid,
        author: c.commit.author.name,
        email: c.commit.author.email,
        date: dateStr,
        subject: c.commit.message.split('\n')[0], // First line of message
        message: c.commit.message,
        files: c.files || [],
        additions: c.additions || 0,
        deletions: c.deletions || 0
      };
    });

    const initialResults = {
      totalCommits: processedCommits.length,
      recentCommits: processedCommits.slice(0, 10),
      history: processedCommits,
    };

    // Send initial data immediately
    if (onProgress) {
      onProgress(initialResults);
    }

    // Run each analyzer sequentially (or could be parallel) and stream updates
    // Using a loop to simulate "yield" behavior
    for (const analyzer of analyzers) {
      // Small delay to allow UI to update if this were blocking (it's not heavy cpu here but good practice for "loading")
      // In a real heavy compute scenario we might use setImmediate or worker.
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisResult = analyzer.analyze(processedCommits);

      if (onProgress) {
        onProgress(analysisResult);
      }

      Object.assign(initialResults, analysisResult);
    }

    return initialResults;
  },

  calculateMetrics(commits) {
    // Legacy method - still useful if needed without streaming
    const results = {
      totalCommits: commits.length,
      recentCommits: commits.slice(0, 10),
      history: commits,
    };

    analyzers.forEach(analyzer => {
      Object.assign(results, analyzer.analyze(commits));
    });

    return results;
  }
};
