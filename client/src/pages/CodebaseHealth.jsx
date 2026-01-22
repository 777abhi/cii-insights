import {
    BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
    FileCode, GitPullRequest, PieChart as PieIcon, AlertTriangle, Loader
} from 'lucide-react';
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

export default function CodebaseHealth({ data }) {
    if (!data) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Codebase Health & Quality</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-80">
                {/* Churn Stats */}
                <Card title="Code Churn (Last 30 Days)" icon={GitPullRequest}>
                    {!data.churn ? <LoadingState /> : (
                        <div className="flex flex-col justify-center h-full gap-8">
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
                    )}
                </Card>

                {/* Commit Types Pie Chart */}
                <Card title="Commit Type Distribution" icon={PieIcon} className="lg:col-span-2">
                    {!data.commitTypes ? <LoadingState /> : (
                        <div className="flex h-full">
                            <div className="flex-1 h-full">
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
                            </div>
                            <div className="w-48 flex flex-col justify-center gap-2 overflow-y-auto">
                                {data.commitTypes.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2 text-xs text-dark-muted">
                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        <span className="truncate flex-1">{entry.name}</span>
                                        <span className="font-bold text-white">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Hotspots Chart */}
            <div className="h-96">
                <Card title="Hotspots (Most Frequently Changed Files)" icon={FileCode}>
                    {!data.hotspots ? <LoadingState /> : (
                        data.hotspots.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.hotspots} layout="vertical" margin={{ left: 10, right: 30, top: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#373a40" horizontal={false} />
                                    <XAxis type="number" stroke="#909296" fontSize={12} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#909296"
                                        fontSize={11}
                                        width={250}
                                        tickFormatter={(value) => {
                                            // Show only filename if path is too long
                                            if (value.length > 40) {
                                                const parts = value.split('/');
                                                return '.../' + parts[parts.length - 1];
                                            }
                                            return value;
                                        }}
                                    />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }} />
                                    <Bar dataKey="value" fill="#ff6b6b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-dark-muted">
                                <AlertTriangle size={32} className="mb-2 opacity-50" />
                                <p>No file data available. (May require deep analysis)</p>
                            </div>
                        )
                    )}
                </Card>
            </div>
        </div>
    );
}
