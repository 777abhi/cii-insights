import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
    GitBranch, GitCommit, Activity, BarChart2, PieChart as PieIcon
} from 'lucide-react';
import { cn } from '../utils/cn';

// Reusing local definitions or we should extract them. 
// For speed, let's duplicate COLORS and Card/MetricValue for now or expect them as props?
// Better to export them from a common place.

const COLORS = ['#339af0', '#51cf66', '#fcc419', '#ff6b6b', '#845ef7', '#f06595'];

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

// We need to access data, loading, setRepoUrl from context or props.
// Props is easier for now.
export default function Dashboard({ data, loading, setRepoUrl, SAMPLE_REPOS }) {
    if (!data && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-dark-muted">
                <Activity size={48} className="mb-4 opacity-50" />
                <h2 className="text-xl font-medium text-white">Ready to Analyze</h2>
                <p className="mb-6">Enter a Git repository URL above to generate insights.</p>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold">Try these sample repos:</span>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {SAMPLE_REPOS.map(repo => (
                            <button
                                key={repo.url}
                                onClick={() => setRepoUrl(repo.url)}
                                className="px-3 py-1.5 rounded-full bg-dark-card border border-dark-border hover:border-primary text-sm text-white transition-colors"
                            >
                                {repo.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
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
                            <XAxis dataKey="date" stroke="#909296" fontSize={12} tickFormatter={d => d.slice(5)} minTickGap={30} />
                            <YAxis stroke="#909296" fontSize={12} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#339af0"
                                strokeWidth={2}
                                dot={data.velocitySeries.length < 40}
                                activeDot={{ r: 6 }}
                            />
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
                        <BarChart data={data.hotspots} layout="vertical" margin={{ left: 10, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#373a40" horizontal={false} />
                            <XAxis type="number" stroke="#909296" fontSize={12} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#909296"
                                fontSize={11}
                                width={220}
                                tickFormatter={(value) => {
                                    if (value.length > 35) {
                                        return '...' + value.slice(-32);
                                    }
                                    return value;
                                }}
                            />
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
                                    {/* Reuse existing commit list item */}
                                    {/* Ignoring CheckCircle import for brevity, assuming generic or passed in */}
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
        </div>
    );
}
