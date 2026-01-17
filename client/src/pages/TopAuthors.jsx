import {
    BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Users } from 'lucide-react';
import { cn } from '../utils/cn';

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

export default function TopAuthors({ data }) {
    if (!data) return (
        <div className="flex flex-col items-center justify-center h-96 text-dark-muted">
            <Users size={48} className="mb-4 opacity-50" />
            <h2 className="text-xl font-medium text-white">No Data Available</h2>
            <p>Please analyze a repository from the Dashboard first.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
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
                    <BarChart data={data.authorMonthlyActivity} margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#373a40" />
                        <XAxis dataKey="date" stroke="#909296" fontSize={12} minTickGap={30} />
                        <YAxis stroke="#909296" fontSize={12} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
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
    );
}
