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

    getMockCommits(): GitCommitWithStats[] {
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
            const timestamp = now - Math.floor(Math.random() * (180 * daySeconds));
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

    async getLog(url: string): Promise<GitCommitWithStats[]> {
        if (url === 'mock-repo') {
            return this.getMockCommits();
        }

        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const commits = await git.log({
            fs,
            dir,
            depth: 2000,
            since: oneYearAgo
        });

        const isNative = Capacitor.isNativePlatform();
        const DEPTH_FOR_STATS = isNative ? 50 : 200;
        const MAX_FILES_PER_COMMIT = 20;
        const BATCH_SIZE = 5;

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

                    for (const change of filesToProcess) {
                        filesList.push({ path: change.path });

                        try {
                            const readBlob = async (oid: string | undefined) => {
                                if (!oid) return '';
                                try {
                                    const { blob } = await git.readBlob({ fs, dir, oid });
                                    return Buffer.from(blob).toString('utf8');
                                } catch { return ''; }
                            };

                            const [oldContent, newContent] = await Promise.all([
                                readBlob(change.oidA),
                                readBlob(change.oidB)
                            ]);

                            const diffStats = DiffUtils.computeStats(oldContent, newContent);
                            totalAdditions += diffStats.additions;
                            totalDeletions += diffStats.deletions;

                        } catch {
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

    async getChangedFiles(dir: string, oid: string, parentOid: string) {
        return git.walk({
            fs,
            dir,
            trees: [git.TREE({ ref: parentOid }), git.TREE({ ref: oid })],
            map: async function (filepath: string, [A, B]: any[]) {
                if (filepath === '.') return;
                if ((await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
                    return;
                }
                const oidA = await A?.oid();
                const oidB = await B?.oid();
                if (oidA !== oidB) {
                    return { path: filepath, oidA, oidB };
                }
            }
        });
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
