import { curriculum } from './curriculum';

// Extract all unique course codes from curriculum
export function getAllCourseCodes() {
    const codes = new Set();

    Object.values(curriculum).forEach(term => {
        // Handle both regular terms and variant terms (term 7 & 8)
        const processTermData = (termData) => {
            Object.entries(termData).forEach(([key, value]) => {
                // Skip slots and baskets, get actual course codes
                if (!key.includes('SLOT') && !key.includes('BASKET') && !key.includes('VARIANT')) {
                    if (key.match(/^[A-Z]{3}\d{3}/)) {
                        // Direct course code
                        codes.add(key);
                    } else if (typeof value === 'object' && value !== null) {
                        // Basket with multiple courses
                        Object.keys(value).forEach(courseCode => {
                            if (courseCode.match(/^[A-Z]{3}\d{3}/)) {
                                codes.add(courseCode);
                            }
                        });
                    }
                }
            });
        };

        // Check if term has variants (COURSEWORK_VARIANT, INTERNSHIP_VARIANT)
        if (term.COURSEWORK_VARIANT) {
            processTermData(term.COURSEWORK_VARIANT);
        }
        if (term.INTERNSHIP_VARIANT) {
            processTermData(term.INTERNSHIP_VARIANT);
        }

        // Process regular term data
        processTermData(term);
    });

    return Array.from(codes).sort();
}

// Get course codes grouped by department
export function getCourseCodesByDepartment() {
    const allCodes = getAllCourseCodes();
    const grouped = {};

    allCodes.forEach(code => {
        const dept = code.substring(0, 3); // First 3 letters (CSE, INT, MTH, etc.)
        if (!grouped[dept]) {
            grouped[dept] = [];
        }
        grouped[dept].push(code);
    });

    return grouped;
}

// Department name mapping
export const departmentNames = {
    'CSE': 'Computer Science & Engineering',
    'INT': 'Integrated Courses',
    'MTH': 'Mathematics',
    'PHY': 'Physics',
    'CHE': 'Chemistry',
    'ECE': 'Electronics & Communication',
    'MEC': 'Mechanical Engineering',
    'PES': 'Physical Education & Sports',
    'PEL': 'Language Electives',
    'PEA': 'Aptitude Electives',
    'PEV': 'Value Education',
    'GEN': 'General Studies',
    'FIN': 'Finance',
    'LAW': 'Law',
    'MKT': 'Marketing',
    'ECO': 'Economics',
    'ENG': 'English',
    'FST': 'Food Science & Technology'
};

// Get semester for a course code (if available in curriculum)
export function getSemesterForCourse(courseCode) {
    for (const [semester, termData] of Object.entries(curriculum)) {
        const checkInTerm = (data) => {
            for (const [key, value] of Object.entries(data)) {
                if (key === courseCode) return semester;
                if (typeof value === 'object' && value !== null && value[courseCode]) {
                    return semester;
                }
            }
            return null;
        };

        // Check variants
        if (termData.COURSEWORK_VARIANT) {
            const sem = checkInTerm(termData.COURSEWORK_VARIANT);
            if (sem) return sem;
        }
        if (termData.INTERNSHIP_VARIANT) {
            const sem = checkInTerm(termData.INTERNSHIP_VARIANT);
            if (sem) return sem;
        }

        // Check regular term
        const sem = checkInTerm(termData);
        if (sem) return sem;
    }
    return null;
}
