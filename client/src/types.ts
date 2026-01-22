export interface FileChange {
  path: string;
  additions?: number;
  deletions?: number;
  oidA?: string;
  oidB?: string;
}

export interface GitCommit {
  oid: string;
  commit: {
    author: {
      name: string;
      email: string;
      timestamp: number;
      timezoneOffset: number;
    };
    committer?: {
        name: string;
        email: string;
        timestamp: number;
        timezoneOffset: number;
    };
    message: string;
    tree?: string;
    parent?: string[];
  };
  payload?: string;
  files?: FileChange[];
  additions?: number;
  deletions?: number;
}

export interface ProcessedCommit {
  hash: string;
  author: string;
  email: string;
  date: string; // "YYYY-MM-DD HH:mm:ss"
  subject: string;
  message: string;
  files: FileChange[];
  additions: number;
  deletions: number;
}

export interface Repo {
  name: string;
}

export interface AnalysisResult {
  totalCommits: number;
  recentCommits: ProcessedCommit[];
  history: ProcessedCommit[];

  velocitySeries?: { date: string; count: number }[];
  qualitySeries?: any[];
  churnSeries?: any[];
  hotspots?: any[];
  contributors?: any[];
  commitTypes?: any[];
  workPatterns?: any[];

  [key: string]: any;
}

export type OnProgressCallback = (result: Partial<AnalysisResult>) => void;
