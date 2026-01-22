import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, GitCommit, Users, Zap
} from 'lucide-react';
import { cn } from '../utils/cn';

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

export default function Overview({ data }) {
    if (!data) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Executive Summary</h2>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="Velocity" icon={Zap}>
                    <MetricValue
                        value={data.velocitySeries.reduce((acc, curr) => acc + curr.count, 0)}
                        unit="commits"
                        label="Total Volume"
                        subtext="Over monitored period"
                    />
                </Card>
                <Card title="Quality Score" icon={Activity}>
                    <MetricValue
                        value={data.qualityScore}
                        unit="%"
                        label="Conventional Commits"
                        color={data.qualityScore > 80 ? "text-success" : data.qualityScore > 50 ? "text-warning" : "text-danger"}
                    />
                </Card>
                <Card title="Contributors" icon={Users}>
                     <MetricValue
                        value={data.topContributors ? data.topContributors.length : 0}
                        unit="active"
                        label="Team Size"
                    />
                </Card>
                <Card title="Recent Activity" icon={GitCommit}>
                    <div className="flex flex-col justify-center h-full">
                         <div className="text-sm text-dark-muted">Last commit:</div>
                         <div className="text-white font-medium truncate">
                            {data.recentCommits[0]?.date.split(' ')[0]}
                         </div>
                         <div className="text-xs text-dark-muted truncate">
                            by {data.recentCommits[0]?.author}
                         </div>
                    </div>
                </Card>
            </div>

            {/* Velocity Chart */}
            <div className="h-80">
                <Card title="Commit Velocity Trend" icon={Activity}>
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
            </div>

            {/* Recent Commits List (Brief) */}
            <div>
                 <Card title="Recent Activity Log" icon={GitCommit}>
                    <div className="overflow-auto pr-2 max-h-60">
                        <div className="space-y-3">
                            {data.recentCommits.map((commit) => (
                                <div key={commit.hash} className="flex gap-3 items-start border-b border-dark-border pb-3 last:border-0">
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
