import { useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  GitBranch, GitCommit, AlertCircle, CheckCircle, Activity, BarChart2, PieChart as PieIcon,
  Search, RefreshCw, User, Users
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const COLORS = ['#339af0', '#51cf66', '#fcc419', '#ff6b6b', '#845ef7', '#f06595'];

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Card({ children, className, title, icon: Icon }) {
  return (
    <div className={cn("card flex flex-col h-full", className)}>
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-4 text-dark-muted text-sm font-semibold uppercase tracking-wider">
          {Icon && <Icon size={16} />}
          <span>{title}</span>
        </div>
      )}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

function MetricValue({ label, value, unit, subtext, color = "text-white" }) {
  return (
    <div>
      <div className={cn("text-3xl font-bold", color)}>
        {value}
        {unit && <span className="text-lg text-dark-muted ml-1 font-normal">{unit}</span>}
      </div>
      {label && <div className="text-dark-muted text-sm mt-1">{label}</div>}
      {subtext && <div className="text-xs text-dark-muted mt-1">{subtext}</div>}
    </div>
  );
}

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
      const response = await axios.post('http://localhost:3001/api/analyze', {
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
    <div className="min-h-screen bg-dark-bg p-6 text-dark-text">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-primary" />
            QE Analytics Dashboard
          </h1>
          <p className="text-dark-muted mt-1">Real-time Quality Engineering Metrics</p>
        </div>

        <form onSubmit={handleAnalyze} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" size={16} />
            <input
              type="text"
              placeholder="Git Repository URL"
              className="input pl-9 w-64 md:w-80"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
          <input
            type="text"
            placeholder="Branch"
            className="input w-24"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : "Analyze"}
          </button>
        </form>
      </header>

      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Velocity">
              <MetricValue
                value={data.velocitySeries.reduce((acc, curr) => acc + curr.count, 0)}
                unit="commits"
                label="Total Volume"
                subtext={`Over monitored period`}
              />
            </Card>
            <Card title="Quality Score">
              <MetricValue
                value={data.qualityScore}
                unit="%"
                label="Conventional Commits"
                color={data.qualityScore > 80 ? "text-success" : data.qualityScore > 50 ? "text-warning" : "text-danger"}
              />
            </Card>
            <Card title="Code Churn">
              <div className="flex gap-4">
                <MetricValue
                  value={data.churn.added}
                  label="Lines Added"
                  color="text-success"
                />
                <MetricValue
                  value={data.churn.deleted}
                  label="Lines Deleted"
                  color="text-danger"
                />
              </div>
            </Card>
            <Card title="Hotspots">
              <MetricValue
                value={data.hotspots.length}
                unit="files"
                label="Active Files"
                subtext="Top 10 shown below"
              />
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-80">
            <Card title="Commit Velocity" icon={Activity} className="lg:col-span-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.velocitySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#373a40" />
                  <XAxis dataKey="date" stroke="#909296" fontSize={12} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke="#909296" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#339af0" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Commit Types" icon={PieIcon}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.commitTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.commitTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {data.commitTypes.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 text-xs text-dark-muted">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
            <Card title="Hotspots (Most Changed Files)" icon={BarChart2}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hotspots} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#373a40" horizontal={false} />
                  <XAxis type="number" stroke="#909296" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#909296" fontSize={10} width={150} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }} />
                  <Bar dataKey="value" fill="#ff6b6b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Recent Activity" icon={GitCommit}>
              <div className="overflow-auto pr-2">
                <div className="space-y-3">
                  {data.recentCommits.map((commit) => (
                    <div key={commit.hash} className="flex gap-3 items-start border-b border-dark-border pb-3 last:border-0">
                      <div className="mt-1">
                        {/^(feat|fix)/.test(commit.subject) ? (
                          <CheckCircle size={16} className="text-success" />
                        ) : (
                          <GitCommit size={16} className="text-dark-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{commit.subject}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-dark-muted">
                          <span className="font-mono text-primary">{commit.hash.substring(0, 7)}</span>
                          <span>•</span>
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{new Date(commit.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row 3: Contributors & Monthly Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
            <Card title="Top Contributors" icon={Users}>
              <div className="overflow-auto pr-2 h-full">
                <div className="space-y-4">
                  {data.topContributors && data.topContributors.map((author, index) => (
                    <div key={index} className="flex items-center gap-3 border-b border-dark-border pb-3 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-primary font-bold text-xs">
                        {author.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{author.name}</div>
                        <div className="text-xs text-dark-muted truncate">{author.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{author.commits} <span className="text-xs font-normal text-dark-muted">commits</span></div>
                        <div className="text-xs flex gap-2 justify-end">
                          <span className="text-success">+{author.additions}</span>
                          <span className="text-danger">-{author.deletions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Monthly Activity (Top 5 Authors)" icon={Activity}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.authorMonthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#373a40" />
                  <XAxis dataKey="date" stroke="#909296" fontSize={12} />
                  <YAxis stroke="#909296" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }}
                  />
                  <Legend />
                  {/* Dynamically generate bars for each top author present in the data keys (excluding 'date') */}
                  {data.authorMonthlyActivity && data.authorMonthlyActivity.length > 0 &&
                    Object.keys(data.authorMonthlyActivity[0])
                      .filter(key => key !== 'date')
                      .map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                      ))
                  }
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center h-96 text-dark-muted">
          <Activity size={48} className="mb-4 opacity-50" />
          <h2 className="text-xl font-medium text-white">Ready to Analyze</h2>
          <p>Enter a Git repository URL above to generate insights.</p>
        </div>
      )}
    </div>
  );
}
