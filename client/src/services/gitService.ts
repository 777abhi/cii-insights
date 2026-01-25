import git from 'isomorphic-git';
import httpWeb from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';
import { Capacitor } from '@capacitor/core';
import { capacitorHttpPlugin } from './gitHttpPlugin';
import { Buffer } from 'buffer';
import { DiffUtils } from '../utils/diffUtils';
import { GitCommit, Repo, FileChange } from '../types';

// Initialize FS
const fs = new FS('qe-analytics-fs', { wipe: false });

const REPO_ROOT = '/repos';

// Helper to ensure root exists
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

    async cloneOrPull(url: string, branch: string = 'main', onProgress?: (progress: any) => void): Promise<string> {
        await this.init();
        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;

        const isNative = Capacitor.isNativePlatform();
        const http = isNative ? capacitorHttpPlugin : httpWeb;

        if (!isNative && url.startsWith('http')) {
            if (!url.includes('/git-proxy/')) {
                 url = `/git-proxy/${url}`;
            }
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
            } catch (e) { }
        }

        if (exists) {
            console.log(`[GitService] Pulling ${repoName}...`);
            const currentBranch = await git.currentBranch({ fs, dir });
            if (currentBranch !== branch) {
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

    async getLog(url: string): Promise<GitCommit[]> {
        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;

        // Calculate date 1 year ago
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const commits = await git.log({
            fs,
            dir,
            depth: 2000,
            since: oneYearAgo
        });

        // Determine platform for performance tuning
        const isNative = Capacitor.isNativePlatform();

        // Process most recent commits for deep stats (Performance trade-off)
        // Reduced from 300 to 50 for Native (Android) to fix "forever" analysis
        const DEPTH_FOR_STATS = isNative ? 50 : 200;
        const MAX_FILES_PER_COMMIT = 20; // Skip detailed diffs for massive commits
        const BATCH_SIZE = 5; // Parallel concurrency limit

        const commitsWithStats = new Array(commits.length);

        const processCommit = async (i: number) => {
            const commit = commits[i];
            const parent = commits[i + 1];

            let stats: { files: FileChange[]; additions: number; deletions: number } = { files: [], additions: 0, deletions: 0 };

            if (i < DEPTH_FOR_STATS && parent) {
                try {
                    const changes = await this.getChangedFiles(dir, commit.oid, parent.oid);

                    const filesList: FileChange[] = [];
                    let totalAdditions = 0;
                    let totalDeletions = 0;

                    // Limit files to process per commit to avoid stalling
                    const filesToProcess = changes.slice(0, MAX_FILES_PER_COMMIT);

                    for (const change of filesToProcess) {
                        filesList.push({ path: change.path });

                        try {
                            const readBlob = async (oid: string | undefined) => {
                                if (!oid) return '';
                                try {
                                    const { blob } = await git.readBlob({
                                        fs,
                                        dir,
                                        oid
                                    });
                                    return Buffer.from(blob).toString('utf8');
                                } catch (e) {
                                    return '';
                                }
                            };

                            const [oldContent, newContent] = await Promise.all([
                                readBlob(change.oidA),
                                readBlob(change.oidB)
                            ]);

                            const diffStats = DiffUtils.computeStats(oldContent, newContent);

                            totalAdditions += diffStats.additions;
                            totalDeletions += diffStats.deletions;

                        } catch (e) {
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

    async getChangedFiles(dir: string, oid: string, parentOid: string): Promise<FileChange[]> {
        const results = await git.walk({
            fs,
            dir,
            trees: [git.TREE({ ref: parentOid }), git.TREE({ ref: oid })],
            map: async function (filepath: string, [A, B]: [any, any]) {
                if (filepath === '.') return;

                if ((await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
                    return;
                }

                const oidA = await A?.oid();
                const oidB = await B?.oid();

                if (oidA !== oidB) {
                    return {
                        path: filepath,
                        oidA,
                        oidB
                    };
                }
            }
        });
        return (results as any[]).filter(Boolean) as FileChange[];
    },

    async listRepos(): Promise<Repo[]> {
        await this.init();
        try {
            const files = await fs.promises.readdir(REPO_ROOT);
            return files.map((name: string) => ({ name }));
        } catch (e) {
            console.error('Error listing repos:', e);
            return [];
        }
    },

    async deleteRepo(name: string): Promise<void> {
        const dir = `${REPO_ROOT}/${name}`;

        const deleteRecursive = async (path: string) => {
            let stats;
            try {
                stats = await fs.promises.stat(path);
            } catch (e) { return; }

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

    async deleteAllRepos(): Promise<void> {
        const repos = await this.listRepos();
        for (const repo of repos) {
            await this.deleteRepo(repo.name);
        }
    }
};
