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
import { AnalysisResults } from './types';

const SAMPLE_REPOS = [
  { name: 'Mock Repo', url: 'mock-repo' },
  { name: 'Playwright Basics', url: 'https://github.com/777abhi/playwright-typescript-basics' },
  { name: 'React', url: 'https://github.com/facebook/react' },
  { name: 'Playwright', url: 'https://github.com/microsoft/playwright' }
];

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setError(null);
    setData(null);
    setProgress('Initializing...');

    try {
      const isUrl = repoUrl.startsWith('http') || repoUrl.startsWith('git@') || repoUrl.startsWith('ssh://');

      // Check for local folder analysis in Electron
      if (window.electron && !isUrl && repoUrl !== 'mock-repo') {
        setProgress('Analyzing local folder...');
        const response = await fetch('http://localhost:3001/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl, branch: branch || undefined })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Analysis failed');
        }

        const result = await response.json();

        const mapCommit = (c: any) => ({
            ...c,
            message: c.subject,
            date: c.date.replace('T', ' ').substring(0, 19),
            files: c.files.map((f: any) => ({ path: f.path }))
        });

        const mappedData: AnalysisResults = {
            ...result,
            recentCommits: result.recentCommits.map(mapCommit),
            history: result.history.map(mapCommit),
            repo: result.repo,
            branch: result.branch
        };

        setData(mappedData);
      } else {
        await GitService.cloneOrPull(repoUrl, branch, (phase: any) => {
            // phase event from isomorphic-git: { phase, loaded, total }
            if (phase.total) {
            setProgress(`${phase.phase}: ${Math.round(phase.loaded / phase.total * 100)}%`);
            } else {
            setProgress(`${phase.phase}...`);
            }
        });

        setProgress('Analyzing history...');
        const log = await GitService.getLog(repoUrl, days || 30);

        const initialData: any = {
            repo: GitService.getRepoName(repoUrl),
            branch: branch,
            totalCommits: 0,
            recentCommits: [],
            history: [],
        };

        setData(initialData);

        await AnalysisService.analyze(log, (partialResults: any) => {
            setData(prev => {
                const prevData = prev || {};
                const newData = {
                    ...prevData,
                    ...partialResults,
                    repo: GitService.getRepoName(repoUrl),
                    branch: branch
                } as AnalysisResults;
                return newData;
            });
        });
      }

      setProgress('');
    } catch (err: any) {
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
            days={days}
            setDays={setDays}
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
