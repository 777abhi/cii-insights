const gitLogParser = require('./gitLogParser');
const velocityAnalyzer = require('./analyzers/velocityAnalyzer');
const qualityAnalyzer = require('./analyzers/qualityAnalyzer');
const churnAnalyzer = require('./analyzers/churnAnalyzer');
const hotspotAnalyzer = require('./analyzers/hotspotAnalyzer');
const contributorAnalyzer = require('./analyzers/contributorAnalyzer');
const commitTypeAnalyzer = require('./analyzers/commitTypeAnalyzer');

class AnalysisService {
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

  analyze(logOutput) {
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

module.exports = new AnalysisService();
