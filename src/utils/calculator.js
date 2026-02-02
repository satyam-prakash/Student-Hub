export function calculateAttendance(subjects, schedule, holidays, lastDate, startDate = new Date()) {
    // Deep copy to avoid mutating inputs
    const currentStats = subjects.reduce((acc, sub) => {
        acc[sub.name] = {
            attended: parseInt(sub.attended) || 0,
            dutyLeave: parseInt(sub.dutyLeave) || 0,
            total: parseInt(sub.total) || 0
        };
        return acc;
    }, {});

    const holidaySet = new Set(holidays);
    const start = new Date(startDate);
    const end = new Date(lastDate);

    // Reset time components to compare dates correctly
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const weekWise = [];
    let currentWeekStats = JSON.parse(JSON.stringify(currentStats));
    let currentWeekStart = new Date(start);

    // Helper to calculate overall stats for a snapshot
    const getOverallStats = (stats) => {
        const totalAttended = Object.values(stats).reduce((sum, s) => sum + s.attended, 0);
        const totalDutyLeave = Object.values(stats).reduce((sum, s) => sum + (s.dutyLeave || 0), 0);
        const totalClasses = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
        return {
            attended: totalAttended,
            dutyLeave: totalDutyLeave,
            total: totalClasses,
            percentage: totalClasses === 0 ? 0 : (((totalAttended + totalDutyLeave) / totalClasses) * 100).toFixed(2)
        };
    };

    // Helper to get local YYYY-MM-DD
    const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Iterate day by day
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = getLocalDateString(d);
        const dayName = dayNames[d.getDay()];

        if (holidaySet.has(dateString)) continue;

        const subjectsToday = schedule[dayName] || [];
        subjectsToday.forEach(sub => {
            const subName = typeof sub === 'string' ? sub : sub.name;
            const count = typeof sub === 'string' ? 1 : (sub.count || 1);

            if (currentStats[subName]) {
                currentStats[subName].total += count;
                currentStats[subName].attended += count; // Assuming max attendance for projection
            }
        });

        // Snapshot on Saturday (End of Week)
        if (d.getDay() === 6) { // Saturday
            const statsSnapshot = JSON.parse(JSON.stringify(currentStats));
            weekWise.push({
                date: dateString,
                stats: statsSnapshot,
                overall: getOverallStats(statsSnapshot)
            });
        }
    }

    // Final snapshot
    const finalDateString = getLocalDateString(end);

    // Only add final snapshot if it's different from the last pushed snapshot
    if (weekWise.length === 0 || weekWise[weekWise.length - 1].date !== finalDateString) {
        const finalStatsSnapshot = JSON.parse(JSON.stringify(currentStats));
        weekWise.push({
            date: finalDateString,
            stats: finalStatsSnapshot,
            overall: getOverallStats(finalStatsSnapshot)
        });
    }

    // Calculate percentages
    const finalResults = Object.keys(currentStats).map(name => {
        const { attended, dutyLeave, total } = currentStats[name];
        return {
            name,
            attended,
            dutyLeave,
            total,
            percentage: total === 0 ? 0 : (((attended + dutyLeave) / total) * 100).toFixed(2)
        };
    });

    const overall = finalResults.reduce((acc, curr) => {
        acc.attended += curr.attended;
        acc.dutyLeave += curr.dutyLeave;
        acc.total += curr.total;
        return acc;
    }, { attended: 0, dutyLeave: 0, total: 0 });

    overall.percentage = overall.total === 0 ? 0 : (((overall.attended + overall.dutyLeave) / overall.total) * 100).toFixed(2);

    return {
        subjectWise: finalResults,
        overall,
        weekWise
    };
}
