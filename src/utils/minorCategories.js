// Engineering Minor Areas
export const engineeringMinors = {
    "Cloud Computing": [
        "INT330", "INT362", "INT363", "INT364", "INT327"
    ],
    "Cyber Security": [
        "INT242", "INT244", "INT249", "INT250", "INT251"
    ],
    "Data Science": [
        "INT217", "INT233", "INT234", "INT312", "INT315", "INT374", "INT375"
    ],
    "Machine Learning": [
        "INT254", "INT344", "INT345", "INT354", "INT422", "INT423"
    ],
    "Full Stack Web Development": [
        "INT219", "INT220", "INT221", "INT222", "INT252", "INT253"
    ],
    "Internet of Things (IOT)": [
        "ECE217", "ECE237", "ECE341", "ECE128", "ECE129", "ECE140"
    ],
    "Software Methodologies and Testing": [
        "CSE374", "CSE375", "CSE376", "CSE377", "CSE378", "CSE379"
    ],

};

// Pathway Elective Categories
export const pathwayElectives = {
    "Government Jobs": [
        "PEA306", "PEA308", "CSE333", "CSE334"
    ],
    "Higher Studies": [
        "PEA306", "PEA308", "CSE333", "CSE334"
    ],
    "Product Based": [
        "CSE329", "CSE333", "CSE330", "CSE331"
    ],
    "Service Based": [
        "PEA308", "PEA306", "PEV301", "CSE357"
    ]
};

// Open Minor Categories (distributed across semesters 5-8)
export const openMinors = {
    "DevOps": [
        "INT331", "INT332", "INT333", "INT334"
    ],
    "Android Application Development": [
        "CSE224",  // Sem 5
        "CSE225",  // Sem 6
        "CSE226",  // Sem 7
        "CSE227",  // Sem 8
        "INT397",  // Sem 6
        "INT398",  // Sem 7
        "INT399",  // Sem 8
        "INT400"   // Sem 8
    ],
    "Banking and Financial Services": [
        "FIN314",  // Sem 5
        "FIN318",  // Sem 6
        "FIN319",  // Sem 7
        "FIN901"   // Sem 8
    ],
    "Business Laws": [
        "LAW252",  // Sem 5
        "LAW255",  // Sem 6
        "LAW256",  // Sem 7
        "LAW257"   // Sem 8
    ]
};

// Helper function to find which category a course belongs to
export function getCategoryForCourse(courseCode) {
    // Check Engineering Minors
    for (const [categoryName, courses] of Object.entries(engineeringMinors)) {
        if (courses.includes(courseCode)) {
            return { type: 'ENGINEERING_MINOR', name: categoryName, courses: courses };
        }
    }

    // Check Pathway Electives
    for (const [categoryName, courses] of Object.entries(pathwayElectives)) {
        if (courses.includes(courseCode)) {
            return { type: 'PATHWAY', name: categoryName, courses: courses };
        }
    }

    // Check Open Minors
    for (const [categoryName, courses] of Object.entries(openMinors)) {
        if (courses.includes(courseCode)) {
            return { type: 'OPEN_MINOR', name: categoryName, courses: courses };
        }
    }

    return null;
}

// Helper function for backward compatibility
export function getMinorForCourse(courseCode) {
    const category = getCategoryForCourse(courseCode);
    if (category && category.type === 'ENGINEERING_MINOR') {
        return { name: category.name, courses: category.courses };
    }
    return null;
}
