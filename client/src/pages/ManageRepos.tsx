import { useState, useEffect, useCallback } from 'react';
import { Trash2, Folder, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { GitService } from '../services/gitService';
import { Repo } from '../types';

export default function ManageRepos() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchRepos = useCallback(async () => {
        try {
            setLoading(true);
            const list = await GitService.listRepos();
            setRepos(list);
            // clear selection on refresh
            setSelected(new Set());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRepos();
    }, [fetchRepos]);

    const toggleSelect = (name: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(name)) {
            newSelected.delete(name);
        } else {
            newSelected.add(name);
        }
        setSelected(newSelected);
    };

    const toggleSelectAll = () => {
        if (selected.size === repos.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(repos.map(r => r.name)));
        }
    };

    const handleDelete = async (all = false) => {
        if (!confirm(all ? "Are you sure you want to delete ALL repositories? This cannot be undone." : `Delete ${selected.size} repositories?`)) {
            return;
        }

        setDeleting(true);
        try {
            if (all) {
                await GitService.deleteAllRepos();
            } else {
                for (const name of selected) {
                    await GitService.deleteRepo(name);
                }
            }
            await fetchRepos();
        } catch (err: any) {
            alert("Failed to delete: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading && repos.length === 0) return <div className="p-8 text-center text-dark-muted">Loading repositories...</div>;
    if (error) return <div className="p-8 text-danger">Error: {error}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Folder className="text-primary" />
                    Manage Local Repositories
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleDelete(false)}
                        disabled={selected.size === 0 || deleting}
                        className="btn bg-red-900/50 text-red-200 hover:bg-red-900/80 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete Selected ({selected.size})
                    </button>
                    <button
                        onClick={() => handleDelete(true)}
                        disabled={repos.length === 0 || deleting}
                        className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <AlertTriangle size={16} />
                        Delete ALL
                    </button>
                </div>
            </div>

            <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                <div className="flex items-center p-3 border-b border-dark-border bg-dark-bg/50 text-sm font-medium text-dark-muted">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 hover:text-white transition-colors">
                        {repos.length > 0 && selected.size === repos.length ? <CheckSquare size={18} /> : <Square size={18} />}
                        Select All
                    </button>
                    <span className="ml-auto">{repos.length} Repositories</span>
                </div>

                {repos.length === 0 ? (
                    <div className="p-12 text-center text-dark-muted">
                        No repositories cloned locally.
                    </div>
                ) : (
                    <div className="divide-y divide-dark-border">
                        {repos.map(repo => (
                            <div
                                key={repo.name}
                                className={`flex items-center p-3 hover:bg-dark-bg/30 transition-colors cursor-pointer ${selected.has(repo.name) ? 'bg-primary/5' : ''}`}
                                onClick={() => toggleSelect(repo.name)}
                            >
                                <div className={`mr-3 ${selected.has(repo.name) ? 'text-primary' : 'text-dark-muted'}`}>
                                    {selected.has(repo.name) ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <Folder size={18} className="text-dark-muted mr-3" />
                                <span className="text-white font-medium">{repo.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
