"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const REPO_DIR = path_1.default.join(__dirname, '../../../repos');
// Ensure repo dir exists
if (!fs_1.default.existsSync(REPO_DIR)) {
    fs_1.default.mkdirSync(REPO_DIR, { recursive: true });
}
class GitServiceClass {
    constructor() {
        this.repoDir = REPO_DIR;
    }
    getRepoName(url) {
        const parts = url.split('/');
        return parts[parts.length - 1].replace('.git', '');
    }
    async cloneOrPull(repoUrl, branch = 'main') {
        const repoName = this.getRepoName(repoUrl);
        const localPath = path_1.default.join(this.repoDir, repoName);
        const git = (0, simple_git_1.default)();
        if (fs_1.default.existsSync(localPath)) {
            console.log(`Repository ${repoName} exists. Pulling latest changes...`);
            await (0, simple_git_1.default)(localPath).fetch();
            try {
                await (0, simple_git_1.default)(localPath).checkout(branch);
                await (0, simple_git_1.default)(localPath).pull();
            }
            catch (e) {
                console.log(`Checkout failed, trying to checkout remote branch ${branch}`);
                await (0, simple_git_1.default)(localPath).checkout(['-t', `origin/${branch}`]);
                await (0, simple_git_1.default)(localPath).pull();
            }
        }
        else {
            console.log(`Cloning ${repoUrl} to ${localPath}...`);
            await git.clone(repoUrl, localPath);
            await (0, simple_git_1.default)(localPath).checkout(branch);
        }
        return localPath;
    }
    async getLog(repoName, branch = 'main') {
        const localPath = path_1.default.join(this.repoDir, repoName);
        const repoGit = (0, simple_git_1.default)(localPath);
        const logOptions = [
            branch,
            `--pretty=format:COMMIT::%H::%an::%ae::%ad::%s`,
            '--stat',
            '--max-count=2000',
            '--date=iso'
        ];
        return await repoGit.raw(['log', ...logOptions]);
    }
    listRepos() {
        if (!fs_1.default.existsSync(this.repoDir))
            return [];
        return fs_1.default.readdirSync(this.repoDir).filter(file => {
            return fs_1.default.statSync(path_1.default.join(this.repoDir, file)).isDirectory();
        }).map(name => ({ name }));
    }
    deleteRepo(repoName) {
        const repoPath = path_1.default.join(this.repoDir, repoName);
        if (fs_1.default.existsSync(repoPath)) {
            fs_1.default.rmSync(repoPath, { recursive: true, force: true });
            return true;
        }
        return false;
    }
    deleteAllRepos() {
        if (!fs_1.default.existsSync(this.repoDir))
            return;
        const allRepos = fs_1.default.readdirSync(this.repoDir);
        allRepos.forEach(repo => {
            const repoPath = path_1.default.join(this.repoDir, repo);
            fs_1.default.rmSync(repoPath, { recursive: true, force: true });
        });
    }
}
exports.GitService = new GitServiceClass();
