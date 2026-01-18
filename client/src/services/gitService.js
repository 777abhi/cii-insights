import git from 'isomorphic-git';
import httpWeb from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';
import { Capacitor } from '@capacitor/core';
import { capacitorHttpPlugin } from './gitHttpPlugin';
import { Buffer } from 'buffer';

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

    async cloneOrPull(url, branch = 'main', onProgress) {
        await this.init();
        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;

        // Determine platform-specific HTTP client
        // Use custom plugin for Native (to bypass CORS), and standard web plugin for Browser
        const http = Capacitor.isNativePlatform() ? capacitorHttpPlugin : httpWeb;

        let exists = false;
        try {
            // Robust check: ensure .git directory exists
            await fs.promises.stat(`${dir}/.git`);
            exists = true;
        } catch (e) {}

        // If directory exists but .git is missing (e.g. previous failed clone), treat as not exists
        if (!exists) {
            try {
                const stat = await fs.promises.stat(dir);
                if (stat) {
                    console.log(`[GitService] ${repoName} exists but is invalid. Deleting...`);
                    await this.deleteRepo(repoName);
                }
            } catch(e) { /* ignore if dir doesn't exist */ }
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
                } catch(e) {
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
        const repoName = this.getRepoName(url);
        const dir = `${REPO_ROOT}/${repoName}`;
        return git.log({
            fs,
            dir,
            depth: 2000,
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
            } catch (e) { return; } // Doesn't exist

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
        } catch(e) {
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
