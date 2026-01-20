class VelocityAnalyzer {
  analyze(commits) {
    const commitsByDay = {};
    commits.forEach(c => {
      const day = c.date.split(' ')[0];
      commitsByDay[day] = (commitsByDay[day] || 0) + 1;
    });

    const velocitySeries = Object.keys(commitsByDay).sort().map(date => ({
      date,
      count: commitsByDay[date]
    }));

    return { velocitySeries };
  }
}
module.exports = new VelocityAnalyzer();
