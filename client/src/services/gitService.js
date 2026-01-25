import git from 'isomorphic-git';
import httpWeb from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';
import { Capacitor } from '@capacitor/core';
import { capacitorHttpPlugin } from './gitHttpPlugin';
import { Buffer } from 'buffer';
import { DiffUtils } from '../utils/diffUtils';

// Initialize FS
const fs = new FS('qe-analytics-fs', { wipe: false });

// Note: git.plugins is deprecated in isomorphic-git v1.x.
// We must pass 'fs' and 'http' explicitly to each function.

const REPO_ROOT = '/repos';

// Helper to ensure root exists
const ensureRoot = async () => {
    try {
        await fs.promises.mkdir(REPO_ROOT);
    } catch (e) {
        if (e.code !== 'EEXIST') console.error(e);
    }
};

export const GitService = {
    async init() {
        await ensureRoot();
    },

    getRepoName(url) {
        const parts = url.split('/');
        return parts[parts.length - 1].replace('.git', '');
    },

    getMockCommits() {
        const commits = [];
        const authors = [
            { name: 'Alice Smith', email: 'alice@example.com' },
            { name: 'Bob Jones', email: 'bob@example.com' },
            { name: 'Charlie Lee', email: 'charlie@example.com' },
            { name: 'Dave Wilson', email: 'dave@example.com' }
        ];
        // Files for hotspots simulation
        const files = [
            'src/index.js', 'src/App.js', 'src/components/Header.js',
            'src/utils/helpers.js', 'README.md', 'package.json',
            'src/core/Engine.js', 'src/services/api.js'
        ];

        const now = Math.floor(Date.now() / 1000);
        const daySeconds = 86400;

        // Generate ~500 commits
        for (let i = 0; i < 500; i++) {
            const author = authors[Math.floor(Math.random() * authors.length)];
            // Random time within last 6 months
            const timestamp = now - Math.floor(Math.random() * (180 * daySeconds));

            // Generate message
            const types = ['feat', 'fix', 'chore', 'docs', 'refactor'];
            const type = types[Math.floor(Math.random() * types.length)];
            const message = `${type}: mock commit message ${i}\n\nDetailed description of commit ${i}`;

            // Stats
            const additions = Math.floor(Math.random() * 50);
            const deletions = Math.floor(Math.random() * 20);
            const changedFiles = [];
            const numFiles = Math.floor(Math.random() * 3) + 1;

            // Make Engine.js a hotspot
            if (Math.random() > 0.7) {
                 changedFiles.push({ path: 'src/core/Engine.js' });
            }

            for(let j=0; j<numFiles; j++) {
                const f = files[Math.floor(Math.random() * files.length)];
                if (!changedFiles.find(x => x.path === f)) {
                    changedFiles.push({ path: f });
                }
            }

            commits.push({
                oid: `mock-hash-${i}`,
                commit: {
                    message,
                    author: {
                        name: author.name,
                        email: author.email,
                        timestamp,
                        timezoneOffset: 0
                    },
                    committer: {
                         name: author.name,
                         email: author.email,
                         timestamp,
                         timezoneOffset: 0
                    }
                },
                files: changedFiles,
                additions,
                deletions
            });
        }

        // Sort by timestamp desc
        return commits.sort((a, b) => b.commit.author.timestamp - a.commit.author.timestamp);
    },

    async cloneOrPull(url, branch = 'main', onProgress) {
        if (url === 'mock-repo') {
            await new Promise(r => setTimeout(r, 1000)); // Simulate delay
            return '/repos/mock-repo';
        }

        await this.init();
        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;

        // Determine platform-specific HTTP client
        // Use custom plugin for Native (to bypass CORS), and standard web plugin for Browser
        const isNative = Capacitor.isNativePlatform();
        const http = isNative ? capacitorHttpPlugin : httpWeb;

        // If in browser (not native), use our local CORS proxy
        if (!isNative && url.startsWith('http')) {
            url = `/git-proxy/${url}`;
        }

        let exists = false;
        try {
            // Robust check: ensure .git directory exists
            await fs.promises.stat(`${dir}/.git`);
            exists = true;
        } catch { /* ignore */ }

        // If directory exists but .git is missing (e.g. previous failed clone), treat as not exists
        if (!exists) {
            try {
                const stat = await fs.promises.stat(dir);
                if (stat) {
                    console.log(`[GitService] ${repoName} exists but is invalid. Deleting...`);
                    await this.deleteRepo(repoName);
                }
            } catch { /* ignore if dir doesn't exist */ }
        }

        if (exists) {
            console.log(`[GitService] Pulling ${repoName}...`);
            // Check if we are on the right branch
            const currentBranch = await git.currentBranch({ fs, dir });
            if (currentBranch !== branch) {
                // Checkout or switch
                try {
                    await git.checkout({
                        fs,
                        dir,
                        ref: branch
                    });
                } catch {
                    console.log(`Checkout failed, maybe fetch first?`);
                }
            }

            await git.pull({
                fs,
                http,
                dir,
                ref: branch,
                singleBranch: true,
                author: { name: 'QE Analytics', email: 'bot@qeanalytics.app' },
                onProgress
            });
        } else {
            console.log(`[GitService] Cloning ${repoName}...`);
            await git.clone({
                fs,
                http,
                dir,
                url,
                ref: branch,
                singleBranch: true,
                depth: 2000,
                onProgress
            });
        }
        return dir;
    },

    async getLog(url) {
        if (url === 'mock-repo') {
            return this.getMockCommits();
        }

        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;

        // Calculate date 1 year ago
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Get commits
        const commits = await git.log({
            fs,
            dir,
            depth: 2000,
            since: oneYearAgo
        });

        // Enrich with stats (changed files)
        // Optimization: We only truly need file names for "Hotspots" (Top 10) and counts for "Churn".
        // We can use git.walk to compare commit vs parent.

        // Determine platform for performance tuning
        const isNative = Capacitor.isNativePlatform();

        // Process most recent commits for deep stats (Performance trade-off)
        // Reduced from 300 to 50 for Native (Android) to fix "forever" analysis
        const DEPTH_FOR_STATS = isNative ? 50 : 200;
        const MAX_FILES_PER_COMMIT = 20; // Skip detailed diffs for massive commits
        const BATCH_SIZE = 5; // Parallel concurrency limit

        const commitsWithStats = new Array(commits.length);

        const processCommit = async (i) => {
            const commit = commits[i];
            const parent = commits[i + 1]; // null if last

            let stats = { files: [], additions: 0, deletions: 0 };

            if (i < DEPTH_FOR_STATS && parent) {
                try {
                    // Update: getChangedFiles now needs to return OIDs so we can diff content
                    const changes = await this.getChangedFiles(dir, commit.oid, parent.oid);

                    const filesList = [];
                    let totalAdditions = 0;
                    let totalDeletions = 0;

                    // Limit files to process per commit to avoid stalling
                    const filesToProcess = changes.slice(0, MAX_FILES_PER_COMMIT);

                    for (const change of filesToProcess) {
                        filesList.push({ path: change.path });

                        // Try to compute diff
                        try {
                            // Only diff text files or reasonable size files
                            // For simplicity, we diff all changed files that we can read.
                            // We need to fetch the blob content.

                            // Helper to read blob
                            const readBlob = async (oid) => {
                                if (!oid) return '';
                                try {
                                    const { blob } = await git.readBlob({
                                        fs,
                                        dir,
                                        oid
                                    });
                                    // Convert Uint8Array to string (assuming utf8)
                                    return Buffer.from(blob).toString('utf8');
                                } catch {
                                    return ''; // Binary or error
                                }
                            };

                            const [oldContent, newContent] = await Promise.all([
                                readBlob(change.oidA),
                                readBlob(change.oidB)
                            ]);

                            // Dynamically import DiffUtils to avoid circular dep issues or load it at top
                            // But we can just use the imported one if we add import at top.
                            // Assuming we will add import at top.
                            const diffStats = DiffUtils.computeStats(oldContent, newContent);

                            totalAdditions += diffStats.additions;
                            totalDeletions += diffStats.deletions;

                        } catch {
                            // If diff fails (e.g. binary), count as file change only? 
                            // Or just ignore lines.
                            console.warn('Diff failed for', change.path);
                        }
                    }

                    stats.files = filesList;
                    stats.additions = totalAdditions;
                    stats.deletions = totalDeletions;

                } catch (e) {
                    console.error('Error getting stats for ', commit.oid, e);
                }
            }

            // Merge stats into the commit object
            commitsWithStats[i] = {
                ...commit,
                ...stats
            };
        };

        // Process in batches
        for (let i = 0; i < commits.length; i += BATCH_SIZE) {
            const batch = [];
            for (let j = 0; j < BATCH_SIZE && i + j < commits.length; j++) {
                batch.push(processCommit(i + j));
            }
            await Promise.all(batch);
        }

        return commitsWithStats;
    },

    async getChangedFiles(dir, oid, parentOid) {
        return git.walk({
            fs,
            dir,
            trees: [git.TREE({ ref: parentOid }), git.TREE({ ref: oid })],
            map: async function (filepath, [A, B]) {
                // Ignore directories
                if (filepath === '.') return;

                // A = parent, B = current
                if ((await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
                    return;
                }

                const oidA = await A?.oid();
                const oidB = await B?.oid();

                // If OIDs differ, file changed
                if (oidA !== oidB) {
                    return {
                        path: filepath,
                        oidA,
                        oidB
                    };
                }
            }
        });
    },

    async listRepos() {
        await this.init();
        try {
            const files = await fs.promises.readdir(REPO_ROOT);
            // lightning-fs returns strings
            return files.map(name => ({ name }));
        } catch (e) {
            console.error('Error listing repos:', e);
            return [];
        }
    },

    async deleteRepo(name) {
        const dir = `${REPO_ROOT}/${name}`;

        // Helper for recursive delete
        const deleteRecursive = async (path) => {
            let stats;
            try {
                stats = await fs.promises.stat(path);
            } catch { return; } // Doesn't exist

            if (stats.isDirectory()) {
                const files = await fs.promises.readdir(path);
                for (const file of files) {
                    await deleteRecursive(`${path}/${file}`);
                }
                await fs.promises.rmdir(path);
            } else {
                await fs.promises.unlink(path);
            }
        };

        try {
            // Try native/lightning-fs recursive delete first if supported
            await fs.promises.rmdir(dir, { recursive: true });
        } catch (e) {
            // Fallback to manual recursive delete
            console.log('Falling back to manual recursive delete', e);
            await deleteRecursive(dir);
        }
    },

    async deleteAllRepos() {
        const repos = await this.listRepos();
        for (const repo of repos) {
            await this.deleteRepo(repo.name);
        }
    }
};
