import { ProcessedCommit } from '../../types';

export const WorkPatternAnalyzer = {
  analyze(commits: ProcessedCommit[]) {
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
    const heatmap: { day: number; hour: number; value: number }[] = [];
    for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
            heatmap.push({ day: d, hour: h, value: 0 });
        }
    }

    commits.forEach(c => {
        // c.date is "YYYY-MM-DD HH:mm:ss"
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
