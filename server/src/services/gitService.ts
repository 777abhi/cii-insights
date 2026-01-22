import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';

const REPO_DIR = path.join(__dirname, '../../../repos');

// Ensure repo dir exists
if (!fs.existsSync(REPO_DIR)) {
  fs.mkdirSync(REPO_DIR, { recursive: true });
}

class GitServiceClass {
  repoDir: string;

  constructor() {
    this.repoDir = REPO_DIR;
  }

  getRepoName(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1].replace('.git', '');
  }

  async cloneOrPull(repoUrl: string, branch: string = 'main'): Promise<string> {
    const repoName = this.getRepoName(repoUrl);
    const localPath = path.join(this.repoDir, repoName);
    const git = simpleGit();

    if (fs.existsSync(localPath)) {
      console.log(`Repository ${repoName} exists. Pulling latest changes...`);
      await simpleGit(localPath).fetch();
      try {
        await simpleGit(localPath).checkout(branch);
        await simpleGit(localPath).pull();
      } catch (e) {
        console.log(`Checkout failed, trying to checkout remote branch ${branch}`);
        await simpleGit(localPath).checkout(['-t', `origin/${branch}`]);
        await simpleGit(localPath).pull();
      }
    } else {
      console.log(`Cloning ${repoUrl} to ${localPath}...`);
      await git.clone(repoUrl, localPath);
      await simpleGit(localPath).checkout(branch);
    }

    return localPath;
  }

  async getLog(repoName: string, branch: string = 'main'): Promise<string> {
    const localPath = path.join(this.repoDir, repoName);
    const repoGit = simpleGit(localPath);

    const logOptions = [
      branch,
      `--pretty=format:COMMIT::%H::%an::%ae::%ad::%s`,
      '--stat',
      '--max-count=2000',
      '--date=iso'
    ];

    return await repoGit.raw(['log', ...logOptions]);
  }

  listRepos(): { name: string }[] {
    if (!fs.existsSync(this.repoDir)) return [];

    return fs.readdirSync(this.repoDir).filter(file => {
      return fs.statSync(path.join(this.repoDir, file)).isDirectory();
    }).map(name => ({ name }));
  }

  deleteRepo(repoName: string): boolean {
    const repoPath = path.join(this.repoDir, repoName);
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      return true;
    }
    return false;
  }

  deleteAllRepos(): void {
     if (!fs.existsSync(this.repoDir)) return;
     const allRepos = fs.readdirSync(this.repoDir);
      allRepos.forEach(repo => {
        const repoPath = path.join(this.repoDir, repo);
        fs.rmSync(repoPath, { recursive: true, force: true });
      });
  }
}

export const GitService = new GitServiceClass();
