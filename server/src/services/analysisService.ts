import gitLogParser from './gitLogParser';
import velocityAnalyzer from './analyzers/velocityAnalyzer';
import qualityAnalyzer from './analyzers/qualityAnalyzer';
import churnAnalyzer from './analyzers/churnAnalyzer';
import hotspotAnalyzer from './analyzers/hotspotAnalyzer';
import contributorAnalyzer from './analyzers/contributorAnalyzer';
import commitTypeAnalyzer from './analyzers/commitTypeAnalyzer';
import { Commit } from '../types';

interface Analyzer {
    analyze: (commits: Commit[]) => any;
}

class AnalysisService {
  analyzers: Analyzer[];

  constructor() {
    this.analyzers = [
      velocityAnalyzer,
      qualityAnalyzer,
      churnAnalyzer,
      hotspotAnalyzer,
      contributorAnalyzer,
      commitTypeAnalyzer
    ];
  }

  analyze(logOutput: string): any {
    const commits = gitLogParser.parse(logOutput);

    const results = {
      totalCommits: commits.length,
      recentCommits: commits.slice(0, 10),
    };

    for (const analyzer of this.analyzers) {
      Object.assign(results, analyzer.analyze(commits));
    }

    return results;
  }
}

export default new AnalysisService();
