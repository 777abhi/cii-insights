import { useState, useEffect } from 'react';
import { X, Folder, CornerLeftUp, Check, Home } from 'lucide-react';

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface FileBrowserProps {
    onSelect: (path: string) => void;
    onClose: () => void;
    initialPath?: string;
}

export default function FileBrowser({ onSelect, onClose, initialPath }: FileBrowserProps) {
    const [currentPath, setCurrentPath] = useState(initialPath || '');
    const [parentPath, setParentPath] = useState<string | null>(null);
    const [entries, setEntries] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPath = async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/fs/list?path=${encodeURIComponent(path)}`);
            if (!res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || text);
                } catch {
                    throw new Error(text);
                }
            }
            const data = await res.json();
            setCurrentPath(data.path);
            setParentPath(data.parent);
            setEntries(data.entries);
        } catch (err: any) {
            setError(err.message || 'Failed to list directory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPath(currentPath);
    }, []);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Folder className="text-primary" />
                        Browse Local Folder
                    </h3>
                    <button onClick={onClose} className="text-dark-muted hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-2 bg-dark-bg/50 border-b border-dark-border flex items-center gap-2">
                    <button
                        onClick={() => fetchPath('')}
                        className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white"
                        title="Home"
                    >
                        <Home size={18} />
                    </button>
                    <button
                        onClick={() => parentPath && fetchPath(parentPath)}
                        disabled={!parentPath}
                        className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white disabled:opacity-30"
                        title="Up one level"
                    >
                        <CornerLeftUp size={18} />
                    </button>
                    <input
                        type="text"
                        value={currentPath}
                        onChange={(e) => setCurrentPath(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchPath(currentPath)}
                        className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white focus:border-primary outline-none"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 text-dark-muted">
                            Loading...
                        </div>
                    ) : error ? (
                        <div className="p-4 text-red-400 text-center">
                            {error}
                            <button
                                onClick={() => fetchPath('')}
                                className="block mx-auto mt-2 text-primary hover:underline"
                            >
                                Go Home
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {entries.filter(e => e.isDirectory).map((entry) => (
                                <button
                                    key={entry.path}
                                    onClick={() => fetchPath(entry.path)}
                                    className="flex items-center gap-3 p-2 hover:bg-dark-border/50 rounded text-left group"
                                >
                                    <Folder size={18} className="text-primary/70 group-hover:text-primary" />
                                    <span className="text-dark-text group-hover:text-white truncate">
                                        {entry.name}
                                    </span>
                                </button>
                            ))}
                            {entries.length === 0 && (
                                <div className="p-8 text-center text-dark-muted italic">
                                    No folders found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-dark-border flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="btn bg-transparent border border-dark-border hover:bg-dark-border text-dark-text"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSelect(currentPath)}
                        className="btn btn-primary flex items-center gap-2"
                        disabled={!currentPath}
                    >
                        <Check size={18} />
                        Select This Folder
                    </button>
                </div>
            </div>
        </div>
    );
}
