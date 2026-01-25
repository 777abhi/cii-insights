import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TeamPerformance from './pages/TeamPerformance';
import CodebaseHealth from './pages/CodebaseHealth';
import ActivityLog from './pages/ActivityLog';
import ManageRepos from './pages/ManageRepos';
import { GitService } from './services/gitService';
import { AnalysisService } from './services/analysisService';

const SAMPLE_REPOS = [
  { name: 'Mock Repo', url: 'mock-repo' },
  { name: 'Playwright Basics', url: 'https://github.com/777abhi/playwright-typescript-basics' },
  { name: 'React', url: 'https://github.com/facebook/react' },
  { name: 'Playwright', url: 'https://github.com/microsoft/playwright' }
];

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setError(null);
    setData(null);
    setProgress('Initializing...');

    try {
      await GitService.cloneOrPull(repoUrl, branch, (phase) => {
        // phase event from isomorphic-git: { phase, loaded, total }
        if (phase.total) {
          setProgress(`${phase.phase}: ${Math.round(phase.loaded / phase.total * 100)}%`);
        } else {
          setProgress(`${phase.phase}...`);
        }
      });

      setProgress('Analyzing history...');
      const log = await GitService.getLog(repoUrl);

      // Initial empty data structure to start with
      setData({
        repo: GitService.getRepoName(repoUrl),
        branch: branch,
        totalCommits: 0,
        recentCommits: [],
        history: [],
        // Initialize other possibly expected keys if useful for "loading" states, 
        // effectively handled by checks in components
      });

      await AnalysisService.analyze(log, (partialResults) => {
        setData(prev => {
          // If prev is null (first update), just return partialResults with repo info
          // keys: repo, branch are already in 'prev' if we set them above, or we can merge.
          const newData = {
            ...(prev || {}),
            ...partialResults,
            // Ensure repo metadata holds
            repo: GitService.getRepoName(repoUrl),
            branch: branch
          };
          return newData;
        });
      });

      setProgress('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            branch={branch}
            setBranch={setBranch}
            handleAnalyze={handleAnalyze}
            loading={loading}
            error={error}
            progress={progress}
          />
        }>
          <Route index element={
            <Dashboard
              data={data}
              loading={loading}
              setRepoUrl={setRepoUrl}
              SAMPLE_REPOS={SAMPLE_REPOS}
            />
          } />
          <Route path="team" element={<TeamPerformance data={data} />} />
          <Route path="codebase" element={<CodebaseHealth data={data} />} />
          <Route path="activity" element={<ActivityLog data={data} />} />
          <Route path="manage-repos" element={<ManageRepos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
