import { Activity } from 'lucide-react';
import Overview from './Overview';

export default function Dashboard({ data, loading, setRepoUrl, SAMPLE_REPOS }) {
    if (data) {
        return <Overview data={data} />;
    }

    if (!loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-dark-muted">
                <Activity size={48} className="mb-4 opacity-50" />
                <h2 className="text-xl font-medium text-white">Ready to Analyse</h2>
                <p className="mb-6">Enter a Git repository URL above to generate insights.</p>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold">Try these sample repos:</span>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {SAMPLE_REPOS.map(repo => (
                            <button
                                key={repo.url}
                                onClick={() => setRepoUrl(repo.url)}
                                className="px-3 py-1.5 rounded-full bg-dark-card border border-dark-border hover:border-primary text-sm text-white transition-colors"
                            >
                                {repo.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
