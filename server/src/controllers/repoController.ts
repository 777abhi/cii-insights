import { GitService } from '../services/gitService';
import analysisService from '../services/analysisService';
import { Request, Response } from 'express';

class RepoController {
  async analyzeRepo(req: Request, res: Response) {
    const { repoUrl, branch = 'main' } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    try {
      // We don't need localPath return value here necessarily, but the side effect matters
      await GitService.cloneOrPull(repoUrl, branch);
      const repoName = GitService.getRepoName(repoUrl);
      const logOutput = await GitService.getLog(repoName, branch);
      const metrics = analysisService.analyze(logOutput);

      res.json({
        repo: repoName,
        branch,
        ...metrics
      });
    } catch (error: any) {
      console.error('Error processing repository:', error);
      res.status(500).json({ error: error.message });
    }
  }

  listRepos(req: Request, res: Response) {
    try {
      const repos = GitService.listRepos();
      res.json(repos);
    } catch (error: any) {
      console.error('Error listing repositories:', error);
      res.status(500).json({ error: error.message });
    }
  }

  deleteRepos(req: Request, res: Response) {
    const { repos, all } = req.body;

    try {
      if (all) {
        GitService.deleteAllRepos();
        return res.json({ message: 'All repositories deleted' });
      }

      if (repos && Array.isArray(repos)) {
        const results: any[] = [];
        repos.forEach((repoName: string) => {
          const deleted = GitService.deleteRepo(repoName);
          results.push({ name: repoName, status: deleted ? 'deleted' : 'not_found' });
        });
        return res.json({ results });
      }

      res.status(400).json({ error: 'Invalid request. Provide "repos" array or "all": true' });
    } catch (error: any) {
      console.error('Error deleting repositories:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new RepoController();
