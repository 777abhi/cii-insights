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
import { AnalysisResult } from './types';

const SAMPLE_REPOS = [
  { name: 'Playwright Basics', url: 'https://github.com/777abhi/playwright-typescript-basics' },
  { name: 'React', url: 'https://github.com/facebook/react' },
  { name: 'Playwright', url: 'https://github.com/microsoft/playwright' }
];

export interface AppData extends AnalysisResult {
    repo: string;
    branch: string;
}

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [data, setData] = useState<AppData | null>(null);
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
      await GitService.cloneOrPull(repoUrl, branch, (phase: any) => {
        // phase event from isomorphic-git: { phase, loaded, total }
        if (phase.total) {
          setProgress(`${phase.phase}: ${Math.round(phase.loaded / phase.total * 100)}%`);
        } else {
          setProgress(`${phase.phase}...`);
        }
      });

      setProgress('Analyzing history...');
      const log = await GitService.getLog(repoUrl);

      const initialData: Partial<AppData> = {
        repo: GitService.getRepoName(repoUrl),
        branch: branch,
        totalCommits: 0,
        recentCommits: [],
        history: [],
      };

      setData(initialData as AppData);

      await AnalysisService.analyze(log, (partialResults) => {
        setData(prev => {
          const newData = {
            ...(prev || {}),
            ...partialResults,
            repo: GitService.getRepoName(repoUrl),
            branch: branch
          };
          return newData as AppData;
        });
      });

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
