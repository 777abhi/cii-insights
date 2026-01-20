export interface Commit {
    hash: string;
    author: string;
    email: string;
    date: string;
    subject: string;
    files: { path: string, changes: number }[];
    additions: number;
    deletions: number;
}
