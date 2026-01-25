import { VelocityAnalyzer } from './analyzers/velocityAnalyzer';
import { QualityAnalyzer } from './analyzers/qualityAnalyzer';
import { ChurnAnalyzer } from './analyzers/churnAnalyzer';
import { HotspotAnalyzer } from './analyzers/hotspotAnalyzer';
import { ContributorAnalyzer } from './analyzers/contributorAnalyzer';
import { CommitTypeAnalyzer } from './analyzers/commitTypeAnalyzer';
import { WorkPatternAnalyzer } from './analyzers/workPatternAnalyzer';
import { GitCommit, ProcessedCommit, AnalysisResult, OnProgressCallback } from '../types';

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
  async analyze(commits: GitCommit[], onProgress?: OnProgressCallback): Promise<AnalysisResult> {
    const processedCommits: ProcessedCommit[] = commits.map(c => {
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
        subject: c.commit.message.split('\n')[0],
        message: c.commit.message,
        files: c.files || [],
        additions: c.additions || 0,
        deletions: c.deletions || 0
      };
    });

    const initialResults: AnalysisResult = {
      totalCommits: processedCommits.length,
      recentCommits: processedCommits.slice(0, 10),
      history: processedCommits,
    };

    if (onProgress) {
      onProgress(initialResults);
    }

    for (const analyzer of analyzers) {
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisResult = analyzer.analyze(processedCommits);

      if (onProgress) {
        onProgress(analysisResult);
      }

      Object.assign(initialResults, analysisResult);
    }

    return initialResults;
  },

  calculateMetrics(commits: GitCommit[]): AnalysisResult {
    const processedCommits: ProcessedCommit[] = commits.map(c => {
      const timestamp = c.commit.author.timestamp * 1000;
      const offsetMinutes = c.commit.author.timezoneOffset;
      const localTime = new Date(timestamp - (offsetMinutes * 60 * 1000));
      const dateStr = localTime.toISOString().replace('T', ' ').substring(0, 19);

      return {
        hash: c.oid,
        author: c.commit.author.name,
        email: c.commit.author.email,
        date: dateStr,
        subject: c.commit.message.split('\n')[0],
        message: c.commit.message,
        files: c.files || [],
        additions: c.additions || 0,
        deletions: c.deletions || 0
      };
    });

    const results: AnalysisResult = {
      totalCommits: processedCommits.length,
      recentCommits: processedCommits.slice(0, 10),
      history: processedCommits,
    };

    analyzers.forEach(analyzer => {
      Object.assign(results, analyzer.analyze(processedCommits));
    });

    return results;
  }
};
