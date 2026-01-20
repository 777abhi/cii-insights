class HotspotAnalyzer {
  analyze(commits) {
    const fileCounts = {};
    commits.forEach(c => {
      c.files.forEach(f => {
        const fname = f.path;
        fileCounts[fname] = (fileCounts[fname] || 0) + 1;
      });
    });

    const hotspots = Object.entries(fileCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    return { hotspots };
  }
}
module.exports = new HotspotAnalyzer();
