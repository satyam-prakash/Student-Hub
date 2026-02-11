import { getCategoryForCourse } from '../utils/cgpaLogic';

export function useTermManagement(terms, setTerms) {
    const handleCourseChange = (termIndex, courseIndex, field, value) => {
        const newTerms = [...terms];
        const course = newTerms[termIndex].courses[courseIndex];
        course[field] = value;
        if (field === 'actualGrade' && !course.targetGrade) {
            course.targetGrade = value;
        }
        if (field === 'code' && course.isElective) {
            autoSelectRelatedCourses(newTerms, termIndex, course.basketName, value);
        }
        setTerms(newTerms);
    };

    const handleDeleteCourse = (termIndex, courseIndex) => {
        if (window.confirm("Are you sure you want to remove this subject?")) {
            const newTerms = [...terms];
            newTerms[termIndex].courses.splice(courseIndex, 1);
            setTerms(newTerms);
        }
    };

    const handleDeleteTerm = (termIndex) => {
        if (window.confirm(`Are you sure you want to delete Term ${terms[termIndex].termNumber}?`)) {
            const newTerms = [...terms];
            newTerms.splice(termIndex, 1);
            newTerms.forEach((t, i) => t.termNumber = i + 1);
            setTerms(newTerms);
        }
    };

    const handleAddCourse = (termIndex) => {
        const newTerms = [...terms];
        newTerms[termIndex].courses.push({
            id: Math.random().toString(36).substr(2, 9),
            code: '',
            name: 'New Custom Subject',
            isElective: false,
            credits: 3,
            actualGrade: '',
            targetGrade: ''
        });
        setTerms(newTerms);
    };

    const autoSelectRelatedCourses = (termsList, sourceTermIndex, basketName, selectedCode) => {
        const category = getCategoryForCourse(selectedCode);
        if (!category) return;
        const usedCodes = new Set([selectedCode]);
        for (let i = 0; i < termsList.length; i++) {
            const term = termsList[i];
            term.courses.forEach(course => {
                if (!course.isElective) return;
                if (course.basketName.includes('ENGINEERING_MINOR') || course.basketName.includes('PATHWAY') || course.basketName.includes('OPEN_MINOR')) {
                    let isCompatible = false;
                    if (category.type === 'ENGINEERING_MINOR' && course.basketName.includes('ENGINEERING_MINOR')) isCompatible = true;
                    if (category.type === 'OPEN_MINOR' && course.basketName.includes('OPEN_MINOR')) isCompatible = true;
                    if (category.type === 'PATHWAY' && course.basketName.includes('PATHWAY')) isCompatible = true;
                    if (isCompatible) {
                        const match = course.options.find(opt => category.courses.includes(opt) && !usedCodes.has(opt));
                        if (match) {
                            course.code = match;
                            usedCodes.add(match);
                        } else {
                            if (course.code) usedCodes.add(course.code);
                        }
                    } else {
                        if (course.code) usedCodes.add(course.code);
                    }
                } else {
                    if (course.code) usedCodes.add(course.code);
                }
            });
        }
    };

    return {
        handleCourseChange,
        handleDeleteCourse,
        handleDeleteTerm,
        handleAddCourse
    };
}
