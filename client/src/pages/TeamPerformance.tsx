import {
    BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Activity, Users, LucideIcon, Loader, Calendar, Clock, Network } from 'lucide-react';
import { cn } from '../utils/cn';
import { AppData } from '../App';

const COLORS = ['#339af0', '#51cf66', '#fcc419', '#ff6b6b', '#845ef7', '#f06595'];

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    icon?: LucideIcon;
}

function Card({ children, className, title, icon: Icon }: CardProps) {
    return (
        <div className={cn("card flex flex-col h-full", className)}>
            {(title || Icon) && (
                <div className="flex items-center gap-2 mb-4 text-dark-muted text-sm font-semibold uppercase tracking-wider">
                    {Icon && <Icon size={16} />}
                    <span>{title}</span>
                </div>
            )}
            <div className="flex-1 min-h-0 relative">
                {children}
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="absolute inset-0 flex items-center justify-center text-dark-muted">
            <Loader className="animate-spin" size={24} />
        </div>
    );
}

// Helper for Heatmap colors
const getHeatmapColor = (value: number) => {
    if (value === 0) return '#25262b'; // card bg
    if (value < 2) return '#1864ab';
    if (value < 5) return '#1971c2';
    if (value < 10) return '#1c7ed6';
    return '#339af0'; // primary
};


interface TeamPerformanceProps {
    data: AppData | null;
}

export default function TeamPerformance({ data }: TeamPerformanceProps) {
    if (!data) return null;

    const workPatterns = data.workPatterns;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Team Performance</h2>

            {/* Work Patterns Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Work Activity Heatmap" icon={Calendar}>
                    {!workPatterns ? <LoadingState /> : (
                        <div className="h-64 flex flex-col">
                            <div className="flex justify-between text-xs text-dark-muted mb-2 px-8">
                                <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
                            </div>
                            <div className="flex-1 grid grid-cols-[auto_1fr] gap-2">
                                {/* Days Labels */}
                                <div className="flex flex-col justify-between text-xs text-dark-muted py-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="h-6 flex items-center">{d}</div>
                                    ))}
                                </div>
                                {/* Grid */}
                                <div className="grid grid-cols-24 grid-rows-7 gap-1">
                                    {workPatterns.heatmap.map((cell: any, i: number) => (
                                        <div
                                            key={i}
                                            className="rounded-sm"
                                            style={{ backgroundColor: getHeatmapColor(cell.value) }}
                                            title={`${cell.value} commits on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cell.day]} at ${cell.hour}:00`}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-center text-xs text-dark-muted mt-2">
                                Darker Blue = More Activity
                            </div>
                        </div>
                    )}
                </Card>

                <Card title="Activity by Hour of Day" icon={Clock}>
                    {!workPatterns ? <LoadingState /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={workPatterns.hourlyActivity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#373a40" vertical={false} />
                                <XAxis dataKey="hour" stroke="#909296" fontSize={10} />
                                <YAxis stroke="#909296" fontSize={12} />
                                <RechartsTooltip cursor={{ fill: '#2c2e33' }} contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }} />
                                <Bar dataKey="count" fill="#339af0" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            {/* Knowledge Distribution Radar Chart */}
            <div className="h-96">
                <Card title="Knowledge Distribution (Bus Factor)" icon={Network}>
                    {!data.knowledgeDistribution || data.knowledgeDistribution.length === 0 ? (
                        data.knowledgeDistribution ? (
                            <div className="h-full flex items-center justify-center text-dark-muted">
                                Not enough data for Knowledge Distribution
                            </div>
                        ) : <LoadingState />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.knowledgeDistribution}>
                                <PolarGrid stroke="#373a40" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#909296', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#909296' }} />
                                {Object.keys(data.knowledgeDistribution[0] || {})
                                    .filter(k => k !== 'subject' && k !== 'fullMark')
                                    .map((key, index) => (
                                        <Radar
                                            key={key}
                                            name={key}
                                            dataKey={key}
                                            stroke={COLORS[index % COLORS.length]}
                                            fill={COLORS[index % COLORS.length]}
                                            fillOpacity={0.3}
                                        />
                                    ))
                                }
                                <Legend wrapperStyle={{ color: '#909296' }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            {/* Existing Contributors Logic */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
                <Card title="Top Contributors" icon={Users}>
                    {!data.topContributors ? <LoadingState /> : (
                        <div className="overflow-auto pr-2 h-full">
                            <div className="space-y-4">
                                {data.topContributors.map((author: any, index: number) => (
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
                    )}
                </Card>

                <Card title="Monthly Activity Trends" icon={Activity}>
                    {!data.authorMonthlyActivity ? <LoadingState /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.authorMonthlyActivity} margin={{ top: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#373a40" />
                                <XAxis dataKey="date" stroke="#909296" fontSize={12} minTickGap={30} />
                                <YAxis stroke="#909296" fontSize={12} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                {data.authorMonthlyActivity.length > 0 &&
                                    Object.keys(data.authorMonthlyActivity[0])
                                        .filter(key => key !== 'date')
                                        .map((key, index) => (
                                            <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                                        ))
                                }
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>
        </div>
    );
}
