import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, Users, LayoutDashboard, Search, RefreshCw, Folder } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Layout({
    children, // You can use children or Outlet based on structure, here we use Layout as wrapper around Outlet area or just Header wrapper
    repoUrl, setRepoUrl, branch, setBranch, handleAnalyze, loading
}) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-dark-bg p-6 text-dark-text">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-primary" />
                        QE Analytics Dashboard
                    </h1>
                    <p className="text-dark-muted mt-1">Real-time Quality Engineering Metrics</p>
                </div>

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
            </header>

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
        </div>
    );
}
