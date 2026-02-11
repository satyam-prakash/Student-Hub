// Grade mapping
export const gradeMap = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'D': 4,
    'E': 0,
    'F': 0,
    'G': 0,
    'I': null  // Incomplete - excluded from calculation
};

// Compute Term TGPA
export function computeTermTGPA(courses, useTargetGrades = false) {
    let totalPoints = 0.0;
    let totalCredits = 0.0;
    let validCourses = 0;

    courses.forEach(course => {
        // Handle both object structure (react state) or simple object
        const gradeValue = useTargetGrades ? course.targetGrade : course.actualGrade;
        const credits = parseFloat(course.credits);

        if (!gradeValue || !credits || credits <= 0) return;

        const gradePoint = gradeMap[gradeValue.toUpperCase()];
        if (gradePoint === null || gradePoint === undefined) return;

        totalPoints += gradePoint * credits;
        totalCredits += credits;
        validCourses++;
    });

    if (totalCredits === 0) {
        return { tgpa: null, totalPoints: 0, totalCredits: 0, validCourses: 0 };
    }

    const tgpa = Math.round((totalPoints / totalCredits) * 100) / 100;
    return { tgpa, totalPoints, totalCredits, validCourses };
}

// Compute Overall CGPA
export function computeCGPA(terms) {
    let cumPoints = 0.0;
    let cumCredits = 0.0;

    terms.forEach(term => {
        // Allow user to pass already calculated stats or raw courses
        if (term.totalPoints !== undefined && term.totalCredits !== undefined) {
            cumPoints += term.totalPoints;
            cumCredits += term.totalCredits;
        } else if (term.courses) {
            // Need to calculate on fly (defaults to Actual)
            const stats = computeTermTGPA(term.courses, false);
            cumPoints += stats.totalPoints;
            cumCredits += stats.totalCredits;
        }
    });

    if (cumCredits === 0) return null;

    return Math.round((cumPoints / cumCredits) * 100) / 100;
}
