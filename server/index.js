const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getProvider } = require('./git-service');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Support REPO_DIR env var for mobile/custom paths
const REPO_DIR = process.env.REPO_DIR || path.join(__dirname, 'repos');

if (!fs.existsSync(REPO_DIR)) {
  fs.mkdirSync(REPO_DIR, { recursive: true });
}

// Utility to sanitize folder name from URL
function getRepoName(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].replace('.git', '');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', async (req, res) => {
  const { repoUrl, branch = 'main' } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  const repoName = getRepoName(repoUrl);
  const localPath = path.join(REPO_DIR, repoName);

  try {
    const gitService = getProvider();

    // Prepare repo (clone/pull)
    await gitService.prepareRepo(repoUrl, localPath, branch);

    // Get metrics
    const metrics = await gitService.getMetrics(localPath, branch);

    res.json({
      repo: repoName,
      branch,
      ...metrics
    });

  } catch (error) {
    console.error('Error processing repository:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repos - List local repositories
app.get('/api/repos', (req, res) => {
  try {
    if (!fs.existsSync(REPO_DIR)) {
        return res.json([]);
    }
    const repos = fs.readdirSync(REPO_DIR).filter(file => {
      try {
        return fs.statSync(path.join(REPO_DIR, file)).isDirectory();
      } catch (e) {
        return false;
      }
    });
    const repoDetails = repos.map(name => ({ name }));
    res.json(repoDetails);
  } catch (error) {
    console.error('Error listing repositories:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/repos - Delete specified repositories
app.delete('/api/repos', (req, res) => {
  const { repos, all } = req.body;

  try {
    if (all) {
      if (fs.existsSync(REPO_DIR)) {
          const allRepos = fs.readdirSync(REPO_DIR);
          allRepos.forEach(repo => {
            const repoPath = path.join(REPO_DIR, repo);
            fs.rmSync(repoPath, { recursive: true, force: true });
          });
      }
      return res.json({ message: 'All repositories deleted' });
    }

    if (repos && Array.isArray(repos)) {
      const results = [];
      repos.forEach(repoName => {
        const repoPath = path.join(REPO_DIR, repoName);
        if (fs.existsSync(repoPath)) {
          fs.rmSync(repoPath, { recursive: true, force: true });
          results.push({ name: repoName, status: 'deleted' });
        } else {
          results.push({ name: repoName, status: 'not_found' });
        }
      });
      return res.json({ results });
    }

    res.status(400).json({ error: 'Invalid request. Provide "repos" array or "all": true' });
  } catch (error) {
    console.error('Error deleting repositories:', error);
    res.status(500).json({ error: error.message });
  }
});

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, () => {
  const ip = getLocalIpAddress();
  console.log(`Server running on port ${PORT}`);
  console.log(`To connect from Android, use API Base URL: http://${ip}:${PORT}`);
});
