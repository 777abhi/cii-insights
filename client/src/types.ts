export interface ProcessedCommit {
  hash: string;
  author: string;
  email: string;
  date: string; // "YYYY-MM-DD HH:mm:ss"
  subject: string;
  message: string;
  files: { path: string }[];
  additions: number;
  deletions: number;
}

export interface GitCommitWithStats {
    oid: string;
    commit: {
        message: string;
        author: {
            name: string;
            email: string;
            timestamp: number;
            timezoneOffset: number;
        };
        committer: {
            name: string;
            email: string;
            timestamp: number;
            timezoneOffset: number;
        };
    };
    files: { path: string; oidA?: string; oidB?: string }[];
    additions: number;
    deletions: number;
}

export interface AnalysisResults {
  totalCommits: number;
  recentCommits: ProcessedCommit[];
  history: ProcessedCommit[];
  velocitySeries?: { date: string; count: number }[];
  qualityScore?: number;
  topContributors?: { name: string; email: string; commits: number; additions: number; deletions: number }[];
  authorMonthlyActivity?: Record<string, string | number>[];
  knowledgeDistribution?: Record<string, string | number>[];
  hotspots?: { name: string; value: number }[];
  commitTypes?: { name: string; value: number }[];
  churn?: { added: number; deleted: number };
  churnTrend?: { date: string; added: number; deleted: number }[];
  workPatterns?: {
      hourlyActivity: { hour: number; count: number }[];
      dailyActivity: { day: string; count: number }[];
      heatmap: { day: number; hour: number; value: number }[];
  };
}
