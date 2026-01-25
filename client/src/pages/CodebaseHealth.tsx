import {
    BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, Treemap
} from 'recharts';
import {
    FileCode, GitPullRequest, PieChart as PieIcon, AlertTriangle, Loader, LucideIcon
} from 'lucide-react';
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

interface MetricValueProps {
    label?: string;
    value: string | number;
    unit?: string;
    subtext?: string;
    color?: string;
}

function MetricValue({ label, value, unit, subtext, color = "text-white" }: MetricValueProps) {
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

const CustomizedTreemapContent = (props: any) => {
    const { x, y, width, height, index, name } = props;

    // Calculate intensity based on rank/index (Top items are hotter/redder)
    // index 0 is hottest
    const opacity = 0.4 + (0.6 * (1 - (index / 10)));

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: '#ff6b6b',
                    fillOpacity: opacity,
                    stroke: '#25262b',
                    strokeWidth: 2,
                }}
            />
            {width > 60 && height > 20 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={11}
                    dominantBaseline="middle"
                    style={{ pointerEvents: 'none' }}
                >
                    {name.split('/').pop()}
                </text>
            )}
        </g>
    );
};

interface CodebaseHealthProps {
    data: AppData | null;
}

export default function CodebaseHealth({ data }: CodebaseHealthProps) {
    if (!data) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Codebase Health & Quality</h2>

            {/* Churn Trend Chart */}
            <div className="h-80">
                <Card title="Code Churn Trend (Rework vs Innovation)" icon={GitPullRequest}>
                     {!data.churnTrend ? <LoadingState /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.churnTrend}>
                                <defs>
                                    <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#51cf66" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#51cf66" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDeleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#909296" fontSize={12} minTickGap={30} tickFormatter={d => d.slice(5)} />
                                <YAxis stroke="#909296" fontSize={12} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#373a40" />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }} />
                                <Area type="monotone" dataKey="added" stroke="#51cf66" fillOpacity={1} fill="url(#colorAdded)" />
                                <Area type="monotone" dataKey="deleted" stroke="#ff6b6b" fillOpacity={1} fill="url(#colorDeleted)" />
                            </AreaChart>
                        </ResponsiveContainer>
                     )}
                </Card>
            </div>

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
                                            {data.commitTypes.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-48 flex flex-col justify-center gap-2 overflow-y-auto">
                                {data.commitTypes.map((entry: any, index: number) => (
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
                <Card title="Hotspots (File Heatmap)" icon={FileCode}>
                    {!data.hotspots ? <LoadingState /> : (
                        data.hotspots.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <Treemap
                                    data={data.hotspots}
                                    dataKey="value"
                                    aspectRatio={4 / 3}
                                    stroke="#25262b"
                                    content={<CustomizedTreemapContent />}
                                >
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#25262b', borderColor: '#373a40', color: '#fff' }}
                                        formatter={(value: any, name: any, props: any) => [value, props.payload.name]}
                                    />
                                </Treemap>
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
