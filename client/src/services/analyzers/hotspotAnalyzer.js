export const HotspotAnalyzer = {
  analyze(commits) {
    const fileCounts = {};
    if (commits.some(c => c.files && c.files.length > 0)) {
        commits.forEach(c => {
            c.files.forEach(f => {
                const fname = f.path;
                fileCounts[fname] = (fileCounts[fname] || 0) + 1;
            });
        });
    }

    const hotspots = Object.entries(fileCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    return { hotspots };
  }
};
