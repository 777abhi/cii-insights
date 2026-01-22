"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gitService_1 = require("../services/gitService");
const analysisService_1 = __importDefault(require("../services/analysisService"));
class RepoController {
    async analyzeRepo(req, res) {
        const { repoUrl, branch = 'main' } = req.body;
        if (!repoUrl) {
            return res.status(400).json({ error: 'Repository URL is required' });
        }
        try {
            // We don't need localPath return value here necessarily, but the side effect matters
            await gitService_1.GitService.cloneOrPull(repoUrl, branch);
            const repoName = gitService_1.GitService.getRepoName(repoUrl);
            const logOutput = await gitService_1.GitService.getLog(repoName, branch);
            const metrics = analysisService_1.default.analyze(logOutput);
            res.json({
                repo: repoName,
                branch,
                ...metrics
            });
        }
        catch (error) {
            console.error('Error processing repository:', error);
            res.status(500).json({ error: error.message });
        }
    }
    listRepos(req, res) {
        try {
            const repos = gitService_1.GitService.listRepos();
            res.json(repos);
        }
        catch (error) {
            console.error('Error listing repositories:', error);
            res.status(500).json({ error: error.message });
        }
    }
    deleteRepos(req, res) {
        const { repos, all } = req.body;
        try {
            if (all) {
                gitService_1.GitService.deleteAllRepos();
                return res.json({ message: 'All repositories deleted' });
            }
            if (repos && Array.isArray(repos)) {
                const results = [];
                repos.forEach((repoName) => {
                    const deleted = gitService_1.GitService.deleteRepo(repoName);
                    results.push({ name: repoName, status: deleted ? 'deleted' : 'not_found' });
                });
                return res.json({ results });
            }
            res.status(400).json({ error: 'Invalid request. Provide "repos" array or "all": true' });
        }
        catch (error) {
            console.error('Error deleting repositories:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new RepoController();
