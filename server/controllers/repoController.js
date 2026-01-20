const gitService = require('../services/gitService');
const analysisService = require('../services/analysisService');

class RepoController {
  async analyzeRepo(req, res) {
    const { repoUrl, branch = 'main' } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    try {
      // We don't need localPath return value here necessarily, but the side effect matters
      await gitService.cloneOrPull(repoUrl, branch);
      const repoName = gitService.getRepoName(repoUrl);
      const logOutput = await gitService.getLog(repoName, branch);
      const metrics = analysisService.analyze(logOutput);

      res.json({
        repo: repoName,
        branch,
        ...metrics
      });
    } catch (error) {
      console.error('Error processing repository:', error);
      res.status(500).json({ error: error.message });
    }
  }

  listRepos(req, res) {
    try {
      const repos = gitService.listRepos();
      res.json(repos);
    } catch (error) {
      console.error('Error listing repositories:', error);
      res.status(500).json({ error: error.message });
    }
  }

  deleteRepos(req, res) {
    const { repos, all } = req.body;

    try {
      if (all) {
        gitService.deleteAllRepos();
        return res.json({ message: 'All repositories deleted' });
      }

      if (repos && Array.isArray(repos)) {
        const results = [];
        repos.forEach(repoName => {
          const deleted = gitService.deleteRepo(repoName);
          results.push({ name: repoName, status: deleted ? 'deleted' : 'not_found' });
        });
        return res.json({ results });
      }

      res.status(400).json({ error: 'Invalid request. Provide "repos" array or "all": true' });
    } catch (error) {
      console.error('Error deleting repositories:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RepoController();
