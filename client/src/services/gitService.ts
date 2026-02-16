import git from 'isomorphic-git';
import httpWeb from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';
import { Capacitor } from '@capacitor/core';
import { capacitorHttpPlugin } from './gitHttpPlugin';
import { Buffer } from 'buffer';
import { DiffUtils } from '../utils/diffUtils';
import { GitCommitWithStats } from '../types';

// Initialize FS
const fs = new FS('qe-analytics-fs', { wipe: false });
const REPO_ROOT = '/repos';

// Global cache for tree entries to persist across operations
const globalTreeCache = new Map<string, Promise<any[]>>();
const TREE_CACHE_LIMIT = 20000;

// Global cache for diff stats to persist across operations
const globalDiffCache = new Map<string, { additions: number; deletions: number }>();
const DIFF_CACHE_LIMIT = 20000;

// Global cache for blob contents with LRU eviction
const globalBlobCache = new Map<string, Promise<string>>();
const BLOB_CACHE_LIMIT = 2000;

const ensureRoot = async () => {
    try {
        await fs.promises.mkdir(REPO_ROOT);
    } catch (e: any) {
        if (e.code !== 'EEXIST') console.error(e);
    }
};

export const GitService = {
    async init() {
        await ensureRoot();
    },

    getRepoName(url: string): string {
        const parts = url.split('/');
        return parts[parts.length - 1].replace('.git', '');
    },

    getMockCommits(days: number = 30): GitCommitWithStats[] {
        const commits: GitCommitWithStats[] = [];
        const authors = [
            { name: 'Alice Smith', email: 'alice@example.com' },
            { name: 'Bob Jones', email: 'bob@example.com' },
            { name: 'Charlie Lee', email: 'charlie@example.com' },
            { name: 'Dave Wilson', email: 'dave@example.com' }
        ];
        const files = [
            'src/index.js', 'src/App.js', 'src/components/Header.js',
            'src/utils/helpers.js', 'README.md', 'package.json',
            'src/core/Engine.js', 'src/services/api.js'
        ];

        const now = Math.floor(Date.now() / 1000);
        const daySeconds = 86400;

        for (let i = 0; i < 500; i++) {
            const author = authors[Math.floor(Math.random() * authors.length)];
            const timestamp = now - Math.floor(Math.random() * (days * daySeconds));
            const types = ['feat', 'fix', 'chore', 'docs', 'refactor'];
            const type = types[Math.floor(Math.random() * types.length)];
            const message = `${type}: mock commit message ${i}\n\nDetailed description of commit ${i}`;
            const additions = Math.floor(Math.random() * 50);
            const deletions = Math.floor(Math.random() * 20);
            const changedFiles: { path: string }[] = [];
            const numFiles = Math.floor(Math.random() * 3) + 1;

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
        return commits.sort((a, b) => b.commit.author.timestamp - a.commit.author.timestamp);
    },

    async cloneOrPull(url: string, branch = 'main', onProgress?: (progress: any) => void) {
        if (url === 'mock-repo') {
            await new Promise(r => setTimeout(r, 1000));
            return '/repos/mock-repo';
        }

        await this.init();
        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;
        const isNative = Capacitor.isNativePlatform();
        const http = isNative ? capacitorHttpPlugin : httpWeb;

        if (!isNative && url.startsWith('http')) {
            url = `/git-proxy/${url}`;
        }

        let exists = false;
        try {
            await fs.promises.stat(`${dir}/.git`);
            exists = true;
        } catch { /* ignore */ }

        if (!exists) {
            try {
                const stat = await fs.promises.stat(dir);
                if (stat) {
                    console.log(`[GitService] ${repoName} exists but is invalid. Deleting...`);
                    await this.deleteRepo(repoName);
                }
            } catch { /* ignore */ }
        }

        if (exists) {
            console.log(`[GitService] Pulling ${repoName}...`);
            const currentBranch = await git.currentBranch({ fs, dir });
            if (currentBranch !== branch) {
                try {
                    await git.checkout({ fs, dir, ref: branch });
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

    async getLog(url: string, days: number = 30): Promise<GitCommitWithStats[]> {
        if (url === 'mock-repo') {
            return this.getMockCommits(days);
        }

        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const commits = await git.log({
            fs,
            dir,
            depth: 2000,
            since: sinceDate
        });

        const isNative = Capacitor.isNativePlatform();
        const DEPTH_FOR_STATS = isNative ? 50 : 200;
        const MAX_FILES_PER_COMMIT = 20;
        const BATCH_SIZE = isNative ? 1 : 5;

        const readBlobContent = async (oid: string | undefined, path: string): Promise<string> => {
            if (!oid) return '';

            if (globalBlobCache.has(oid)) {
                // LRU: Refresh key position by re-inserting
                const promise = globalBlobCache.get(oid)!;
                globalBlobCache.delete(oid);
                globalBlobCache.set(oid, promise);
                return promise;
            }

            const promise = (async () => {
                try {
                    // Check size first to avoid memory issues and slow diffs
                    const { object, type } = await git.readObject({ fs, dir, oid, encoding: null });
                    if (type === 'blob') {
                        if (object.length > 500 * 1024) { // 500KB limit
                            console.warn(`Skipping large file diff: ${path} (${object.length} bytes)`);
                            return '';
                        }
                        return Buffer.from(object).toString('utf8');
                    }
                    return '';
                } catch { return ''; }
            })();

            globalBlobCache.set(oid, promise);

            // LRU Eviction
            if (globalBlobCache.size > BLOB_CACHE_LIMIT) {
                const oldestKey = globalBlobCache.keys().next().value;
                if (oldestKey) {
                    globalBlobCache.delete(oldestKey);
                }
            }

            return promise;
        };

        const commitsWithStats: GitCommitWithStats[] = new Array(commits.length);

        const processCommit = async (i: number) => {
            const commit = commits[i];
            const parent = commits[i + 1];

            const stats: { files: any[]; additions: number; deletions: number } = { files: [], additions: 0, deletions: 0 };

            if (i < DEPTH_FOR_STATS && parent) {
                try {
                    const changes = await this.getChangedFiles(dir, commit.oid, parent.oid);
                    const filesList: any[] = [];
                    let totalAdditions = 0;
                    let totalDeletions = 0;
                    const filesToProcess = changes.slice(0, MAX_FILES_PER_COMMIT);

                    // Process file diffs in parallel to speed up analysis
                    const results = await Promise.all(filesToProcess.map(async (change) => {
                        const cacheKey = `${change.oidA}:${change.oidB}`;
                        if (globalDiffCache.has(cacheKey)) {
                            return { path: change.path, ...globalDiffCache.get(cacheKey)! };
                        }

                        try {
                            const [oldContent, newContent] = await Promise.all([
                                readBlobContent(change.oidA, change.path),
                                readBlobContent(change.oidB, change.path)
                            ]);

                            if (oldContent || newContent) {
                                // Yield to main thread to avoid blocking UI during heavy diff computations
                                await new Promise(resolve => setTimeout(resolve, 0));

                                const stats = DiffUtils.computeStats(oldContent, newContent);

                                globalDiffCache.set(cacheKey, stats);
                                // LRU eviction for diff cache
                                if (globalDiffCache.size > DIFF_CACHE_LIMIT) {
                                    const firstKey = globalDiffCache.keys().next().value;
                                    if (firstKey) globalDiffCache.delete(firstKey);
                                }

                                return {
                                    path: change.path,
                                    ...stats
                                };
                            }
                        } catch {
                            console.warn('Diff failed for', change.path);
                        }
                        return { path: change.path, additions: 0, deletions: 0 };
                    }));

                    for (const result of results) {
                        filesList.push({ path: result.path });
                        totalAdditions += result.additions;
                        totalDeletions += result.deletions;
                    }

                    stats.files = filesList;
                    stats.additions = totalAdditions;
                    stats.deletions = totalDeletions;
                } catch (e) {
                    console.error('Error getting stats for ', commit.oid, e);
                }
            }

            commitsWithStats[i] = {
                ...commit,
                files: stats.files,
                additions: stats.additions,
                deletions: stats.deletions
            } as GitCommitWithStats;
        };

        for (let i = 0; i < commits.length; i += BATCH_SIZE) {
            const batch = [];
            for (let j = 0; j < BATCH_SIZE && i + j < commits.length; j++) {
                batch.push(processCommit(i + j));
            }
            await Promise.all(batch);
        }

        return commitsWithStats;
    },

    async getChangedFiles(dir: string, newOid: string, oldOid: string, treeCache: Map<string, Promise<any[]>> = globalTreeCache) {
        if (newOid === oldOid) return [];
        const changes: { path: string, oidA?: string, oidB?: string }[] = [];

        // Sort by name using standard comparison to match the loop logic
        const sorter = (a: { path: string }, b: { path: string }) => a.path < b.path ? -1 : (a.path > b.path ? 1 : 0);

        const compare = async (pathPrefix: string, treeOidA: string | undefined, treeOidB: string | undefined) => {
             if (treeOidA === treeOidB) return;

             let entriesA: any[] = [];
             let entriesB: any[] = [];

             const getTree = (oid: string) => {
                 if (treeCache && treeCache.has(oid)) {
                     // LRU: Refresh
                     const p = treeCache.get(oid)!;
                     treeCache.delete(oid);
                     treeCache.set(oid, p);
                     return p;
                 }

                 const p = (async () => {
                     try {
                         const result = await git.readTree({ fs, dir, oid });
                         const t = result.tree;
                         t.sort(sorter);
                         return t;
                     } catch {
                         console.warn('Error reading tree', oid);
                         return [];
                     }
                 })();

                 if (treeCache) {
                     treeCache.set(oid, p);
                     // LRU Eviction
                     if (treeCache.size > TREE_CACHE_LIMIT) {
                         const firstKey = treeCache.keys().next().value;
                         if (firstKey) treeCache.delete(firstKey);
                     }
                 }
                 return p;
             };

             // Optimization: Fetch both trees in parallel
             [entriesA, entriesB] = await Promise.all([
                 treeOidA ? getTree(treeOidA) : Promise.resolve([]),
                 treeOidB ? getTree(treeOidB) : Promise.resolve([])
             ]);

             const promises: Promise<void>[] = [];

             let i = 0, j = 0;
             while (i < entriesA.length || j < entriesB.length) {
                 const entryA = entriesA[i];
                 const entryB = entriesB[j];

                 const pathA = entryA ? entryA.path : null;
                 const pathB = entryB ? entryB.path : null;

                 if (pathA && (!pathB || pathA < pathB)) {
                     // Deleted (present in A, missing in B)
                     const fullPath = pathPrefix ? `${pathPrefix}/${pathA}` : pathA;
                     if (entryA.type === 'tree') {
                          promises.push(compare(fullPath, entryA.oid, undefined));
                     } else {
                          changes.push({ path: fullPath, oidA: entryA.oid, oidB: undefined });
                     }
                     i++;
                 } else if (pathB && (!pathA || pathB < pathA)) {
                     // Added (present in B, missing in A)
                     const fullPath = pathPrefix ? `${pathPrefix}/${pathB}` : pathB;
                     if (entryB.type === 'tree') {
                          promises.push(compare(fullPath, undefined, entryB.oid));
                     } else {
                          changes.push({ path: fullPath, oidA: undefined, oidB: entryB.oid });
                     }
                     j++;
                 } else {
                     // Both exist
                     if (entryA.oid !== entryB.oid) {
                         const fullPath = pathPrefix ? `${pathPrefix}/${pathA}` : pathA;
                         if (entryA.type === 'tree' && entryB.type === 'tree') {
                             promises.push(compare(fullPath, entryA.oid, entryB.oid));
                         } else {
                             // File changed or type changed
                             changes.push({ path: fullPath, oidA: entryA.oid, oidB: entryB.oid });
                         }
                     }
                     i++;
                     j++;
                 }
             }
             // Optimization: Process sub-trees in parallel (Parallel DFS)
             // Instead of awaiting recursive calls sequentially, we collect promises and await them all at once.
             await Promise.all(promises);
        };

        // Compare Old -> New
        await compare('', oldOid, newOid);

        // Sort changes to ensure deterministic order as parallel processing may finish out of order
        return changes.sort(sorter);
    },

    async listRepos() {
        await this.init();
        try {
            const files = await fs.promises.readdir(REPO_ROOT);
            return files.map((name: string) => ({ name }));
        } catch (e) {
            console.error('Error listing repos:', e);
            return [];
        }
    },

    async deleteRepo(name: string) {
        const dir = `${REPO_ROOT}/${name}`;
        const deleteRecursive = async (path: string) => {
            let stats;
            try {
                stats = await fs.promises.stat(path);
            } catch { return; }

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
            await fs.promises.rmdir(dir, { recursive: true });
        } catch (e) {
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
