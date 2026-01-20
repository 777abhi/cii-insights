"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GitLogParser {
    parse(logOutput) {
        const lines = logOutput.split('\n');
        const commits = [];
        let currentCommit = null;
        const commitRegex = /^COMMIT::([a-f0-9]+)::(.+)::(.+)::(.+)::(.+)$/;
        for (const line of lines) {
            const match = line.match(commitRegex);
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
            }
            else if (currentCommit) {
                // Parse stat lines
                const fileStatRegex = /^ (.+) \| (\d+) (.+)$/;
                const fileMatch = line.match(fileStatRegex);
                if (fileMatch) {
                    // It's a file line
                    currentCommit.files.push({
                        path: fileMatch[1].trim(),
                        changes: parseInt(fileMatch[2], 10)
                    });
                }
                else {
                    if (line.includes('changed') && (line.includes('insertion') || line.includes('deletion'))) {
                        // Parse summary
                        const insertionsMatch = line.match(/(\d+) insertion/);
                        const deletionsMatch = line.match(/(\d+) deletion/);
                        if (insertionsMatch)
                            currentCommit.additions = parseInt(insertionsMatch[1], 10);
                        if (deletionsMatch)
                            currentCommit.deletions = parseInt(deletionsMatch[1], 10);
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
exports.default = new GitLogParser();
