import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, Users, LayoutDashboard, Search, RefreshCw, Folder, Settings, X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Layout({
    repoUrl, setRepoUrl, branch, setBranch, handleAnalyze, loading,
    apiBaseUrl, setApiBaseUrl, error
}) {
    const location = useLocation();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempUrl, setTempUrl] = useState(apiBaseUrl);

    const handleSaveSettings = () => {
        setApiBaseUrl(tempUrl);
        setIsSettingsOpen(false);
    };

    const handleOpenSettings = () => {
        setTempUrl(apiBaseUrl);
        setIsSettingsOpen(true);
    };

    return (
        <div className="min-h-screen bg-dark-bg p-6 text-dark-text relative">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-primary" />
                        QE Analytics Dashboard
                    </h1>
                    <p className="text-dark-muted mt-1">Real-time Quality Engineering Metrics</p>
                </div>

                <div className="flex items-center gap-4">
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

                    <button
                        onClick={handleOpenSettings}
                        className="p-2 text-dark-muted hover:text-white transition-colors"
                        title="Settings"
                    >
                        <Settings size={24} />
                    </button>
                </div>
            </header>

            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-200">
                    <AlertCircle className="shrink-0" />
                    <div>
                        <p className="font-bold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="mb-6 flex gap-4 border-b border-dark-border pb-1">
                <Link
                    to="/"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
                        location.pathname === "/"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <LayoutDashboard size={18} />
                    Dashboard
                </Link>
                <Link
                    to="/authors"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
                        location.pathname === "/authors"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <Users size={18} />
                    Top Authors
                </Link>
                <Link
                    to="/manage-repos"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
                        location.pathname === "/manage-repos"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <Folder size={18} />
                    Manage Repos
                </Link>
            </nav>

            {/* Page Content */}
            <main>
                <Outlet />
            </main>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-dark-card border border-dark-border rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings size={20} />
                                Settings
                            </h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-dark-muted hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                API Base URL
                            </label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="http://localhost:3001"
                                value={tempUrl}
                                onChange={(e) => setTempUrl(e.target.value)}
                            />
                            <p className="text-xs text-dark-muted mt-2">
                                For Android, use your computer's IP address (e.g., http://192.168.1.5:3001).
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-white hover:bg-dark-border transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="btn btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
