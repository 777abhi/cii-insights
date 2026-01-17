import { useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { API_BASE_URL } from './config';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TopAuthors from './pages/TopAuthors';
import ManageRepos from './pages/ManageRepos';

const SAMPLE_REPOS = [
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

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        repoUrl,
        branch
      });
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
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
          <Route path="manage-repos" element={<ManageRepos />} />
          <Route path="authors" element={<TopAuthors data={data} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
