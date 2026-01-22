export const WorkPatternAnalyzer = {
  analyze(commits) {
    // Initialize counters
    const hourlyActivity = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    // 0=Sun, 1=Mon, ..., 6=Sat
    const dailyActivity = [
      { day: 'Sun', count: 0 },
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 },
      { day: 'Sat', count: 0 }
    ];

    // Heatmap: 7 days x 24 hours
    // We'll store it as a flat list or nested. Nested is easier for some charts, flat for others.
    // Let's do a flat list: { day: 0, hour: 0, value: 0 }
    const heatmap = [];
    for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
            heatmap.push({ day: d, hour: h, value: 0 });
        }
    }

    commits.forEach(c => {
        // c.date is "YYYY-MM-DD HH:mm:ss"
        // Replace space with T to ensure valid ISO parsing across all browsers
        const isoDate = c.date.replace(' ', 'T');
        const date = new Date(isoDate);

        if (isNaN(date.getTime())) return;

        const day = date.getDay(); // 0-6 (Sun-Sat)
        const hour = date.getHours(); // 0-23

        dailyActivity[day].count++;
        hourlyActivity[hour].count++;

        const cell = heatmap.find(item => item.day === day && item.hour === hour);
        if (cell) cell.value++;
    });

    return {
        workPatterns: {
            hourlyActivity,
            dailyActivity,
            heatmap
        }
    };
  }
};
