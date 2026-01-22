import { useState } from 'react';
import { GitCommit, Search, User, Calendar } from 'lucide-react';
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

export default function ActivityLog({ data }) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!data) return null;

    const commits = data.history || data.recentCommits || [];
    const filteredCommits = commits.filter(c =>
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.hash.includes(searchTerm)
    );

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Commit History</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search commits..."
                        className="input pl-9 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="flex-1 overflow-hidden">
                <div className="overflow-auto h-full pr-2">
                    <div className="space-y-0">
                        {filteredCommits.length > 0 ? filteredCommits.map((commit) => (
                            <div key={commit.hash} className="flex gap-4 items-start border-b border-dark-border py-4 last:border-0 hover:bg-dark-border/20 transition-colors px-2 rounded-lg">
                                <div className="mt-1">
                                    <GitCommit size={20} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="text-sm font-medium text-white truncate max-w-3xl" title={commit.message}>
                                            {commit.subject}
                                        </div>
                                        <div className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                                            {commit.hash.substring(0, 7)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-dark-muted">
                                        <div className="flex items-center gap-1">
                                            <User size={12} />
                                            <span>{commit.author}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{new Date(commit.date).toLocaleString()}</span>
                                        </div>
                                        {(commit.additions > 0 || commit.deletions > 0) && (
                                            <div className="flex gap-2 ml-2">
                                                <span className="text-success">+{commit.additions}</span>
                                                <span className="text-danger">-{commit.deletions}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-dark-muted">
                                No commits found matching your search.
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
