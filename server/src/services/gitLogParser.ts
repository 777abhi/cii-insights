import { Commit } from '../types';

// Pre-compile regexes for performance
const COMMIT_REGEX = /^COMMIT::([a-f0-9]+)::(.+)::(.+)::(.+)::(.+)$/;
const FILE_STAT_REGEX = /^ (.+) \| (\d+) (.+)$/;
const INSERTION_REGEX = /(\d+) insertion/;
const DELETION_REGEX = /(\d+) deletion/;

class GitLogParser {
  parse(logOutput: string): Commit[] {
    const lines = logOutput.split('\n');
    const commits: Commit[] = [];
    let currentCommit: Commit | null = null;

    for (const line of lines) {
      const match = line.match(COMMIT_REGEX);
      if (match) {
        if (currentCommit) {
          commits.push(currentCommit);
        }
        currentCommit = {
          hash: match[1],
          author: match[2],
          email: match[3],
          date: match[4],
          subject: match[5],
          files: [],
          additions: 0,
          deletions: 0
        };
      } else if (currentCommit) {
        // Parse stat lines
        const fileMatch = line.match(FILE_STAT_REGEX);
        if (fileMatch) {
          // It's a file line
          currentCommit.files.push({
            path: fileMatch[1].trim(),
            changes: parseInt(fileMatch[2], 10)
          });
        } else {
          if (line.includes('changed') && (line.includes('insertion') || line.includes('deletion'))) {
            // Parse summary
            const insertionsMatch = line.match(INSERTION_REGEX);
            const deletionsMatch = line.match(DELETION_REGEX);

            if (insertionsMatch) currentCommit.additions = parseInt(insertionsMatch[1], 10);
            if (deletionsMatch) currentCommit.deletions = parseInt(deletionsMatch[1], 10);
          }
        }
      }
    }
    if (currentCommit) {
      commits.push(currentCommit);
    }
    return commits;
  }
}

export default new GitLogParser();
