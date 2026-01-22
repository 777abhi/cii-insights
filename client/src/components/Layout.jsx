import { Link, Outlet, useLocation } from 'react-router-dom';
import BranchSelector from './BranchSelector';
import { Activity, Users, LayoutDashboard, Search, RefreshCw, Folder, Settings, X, AlertCircle, FileCode, GitCommit } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Layout({
    repoUrl, setRepoUrl, branch, setBranch, handleAnalyze, loading, error, progress
}) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-dark-bg p-6 text-dark-text relative">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-primary" />
                        QE Analytics Dashboard
                    </h1>
                    <p className="text-dark-muted mt-1">Real-time Quality Engineering Metrics (Standalone)</p>
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
                        <BranchSelector
                            branch={branch}
                            setBranch={setBranch}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : "Analyze"}
                        </button>
                    </form>
                </div>
            </header>

            {/* Progress / Loading State */}
            {loading && progress && (
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-dark-muted mb-1">
                        <span>Analysis in progress...</span>
                        <span>{progress}</span>
                    </div>
                    <div className="w-full bg-dark-border rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: progress.includes('%') ? progress.split(':')[1] : '100%', opacity: progress.includes('%') ? 1 : 0.5 }}
                        ></div>
                    </div>
                </div>
            )}

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
            <nav className="mb-6 flex gap-4 border-b border-dark-border pb-1 overflow-x-auto">
                <Link
                    to="/"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                        location.pathname === "/"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <LayoutDashboard size={18} />
                    Overview
                </Link>
                <Link
                    to="/team"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                        location.pathname === "/team"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <Users size={18} />
                    Team
                </Link>
                <Link
                    to="/codebase"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                        location.pathname === "/codebase"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <FileCode size={18} />
                    Codebase
                </Link>
                <Link
                    to="/activity"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                        location.pathname === "/activity"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <GitCommit size={18} />
                    Activity
                </Link>
                <Link
                    to="/manage-repos"
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                        location.pathname === "/manage-repos"
                            ? "border-primary text-primary"
                            : "border-transparent text-dark-muted hover:text-white"
                    )}
                >
                    <Folder size={18} />
                    Repos
                </Link>
            </nav>

            {/* Page Content */}
            <main>
                <Outlet />
            </main>
        </div>
    );
}
