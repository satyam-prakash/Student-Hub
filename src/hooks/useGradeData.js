import { useState, useEffect } from 'react';
import { curriculum, computeTermTGPA, getCategoryForCourse, gradeMap } from '../utils/cgpaLogic';
import { useTermManagement } from './useTermManagement';
import { useDataPersistence } from './useDataPersistence';

export function useGradeData(user) {
    const [terms, setTerms] = useState([]);
    const [currentTerm, setCurrentTerm] = useState(1);
    const [termVariant, setTermVariant] = useState('COURSEWORK_VARIANT');
    const [regNo, setRegNo] = useState('');
    const [stats, setStats] = useState({ actualCGPA: 0, targetCGPA: 0, totalCredits: 0 });

    const initializeTerms = (maxTerm, variant) => {
        const newTerms = [];
        for (let t = 1; t <= maxTerm; t++) {
            newTerms.push(createTermFromSchema(t, variant));
        }
        setTerms(newTerms);
    };

    const createTermFromSchema = (termNum, variant) => {
        const schema = curriculum[String(termNum)];
        const entries = (termNum === 7 || termNum === 8) ? schema?.[variant || 'COURSEWORK_VARIANT'] : schema;
        if (!entries) return { termNumber: termNum, courses: [] };

        const courses = [];
        Object.keys(entries).forEach(key => {
            if (key.endsWith('_SLOT')) return;
            if (key.endsWith('_BASKET')) {
                const basketName = key.replace('_BASKET', '');
                const slotName = basketName + '_SLOT';
                const slotCredit = entries[slotName]?.credit || 3;
                const options = Object.keys(entries[key]).filter(k => entries[key][k].credit || entries[key][k].note).map(k => k);
                courses.push({
                    id: Math.random().toString(36).substr(2, 9),
                    code: '',
                    name: basketName.replace(/_/g, ' '),
                    isElective: true,
                    basketName: basketName,
                    options: options,
                    credits: slotCredit,
                    actualGrade: '',
                    targetGrade: ''
                });
            } else if (entries[key].credit) {
                courses.push({
                    id: Math.random().toString(36).substr(2, 9),
                    code: key,
                    name: key,
                    isElective: false,
                    credits: entries[key].credit,
                    actualGrade: '',
                    targetGrade: ''
                });
            }
        });
        return { termNumber: termNum, courses: courses };
    };

    const handleAddTerm = () => {
        const nextTermNum = terms.length + 1;
        let newTerm = createTermFromSchema(nextTermNum, termVariant);
        if (!newTerm) {
            newTerm = { termNumber: nextTermNum, courses: [] };
        }
        const updatedTerms = [...terms, newTerm];
        const processedCategories = new Set();
        updatedTerms.forEach(t => {
            t.courses.forEach(c => {
                if (c.code && c.basketName && (c.basketName.includes('MINOR') || c.basketName.includes('PATHWAY'))) {
                    const cat = getCategoryForCourse(c.code);
                    if (cat && !processedCategories.has(cat.name)) {
                        processedCategories.add(cat.name);
                    }
                }
            });
        });
        setTerms(updatedTerms);
        setCurrentTerm(nextTermNum);
    };

    const calculateStats = () => {
        const termStats = terms.map(term => computeTermTGPA(term.courses, false));
        const targetTermStats = terms.map(term => computeTermTGPA(term.courses, true));
        let cumPoints = 0, cumCredits = 0;
        let targetCumPoints = 0, targetCumCredits = 0;
        termStats.forEach(t => {
            cumPoints += t.totalPoints;
            cumCredits += t.totalCredits;
        });
        targetTermStats.forEach(t => {
            targetCumPoints += t.totalPoints;
            targetCumCredits += t.totalCredits;
        });
        setStats({
            actualCGPA: cumCredits ? (cumPoints / cumCredits) : 0,
            targetCGPA: targetCumCredits ? (targetCumPoints / targetCumCredits) : 0,
            totalCredits: cumCredits,
            termStats,
            targetTermStats
        });
    };

    const findCreditsForCourse = (courseCode) => {
        if (!courseCode) return null;
        for (const term in curriculum) {
            const termData = curriculum[term];
            if (termData[courseCode] && termData[courseCode].credit) {
                return termData[courseCode].credit;
            }
            for (const key in termData) {
                if (key.includes('BASKET') && termData[key][courseCode]) {
                    return termData[key][courseCode].credit;
                }
            }
        }
        return null;
    };

    const fillExtractedData = async (data) => {
        if (!data || !data.terms) return;
        const newTerms = [...terms];
        const maxExtractedTerm = Math.max(...data.terms.map(t => t.termNumber));
        if (maxExtractedTerm > newTerms.length) {
            for (let i = newTerms.length + 1; i <= maxExtractedTerm; i++) {
                const newTerm = createTermFromSchema(i, termVariant);
                if (newTerm) {
                    newTerms.push(newTerm);
                } else {
                    newTerms.push({ termNumber: i, courses: [] });
                }
            }
        }
        setCurrentTerm(maxExtractedTerm);
        data.terms.forEach(extractedTerm => {
            const termIndex = newTerms.findIndex(t => t.termNumber === extractedTerm.termNumber);
            if (termIndex === -1) return;
            const term = newTerms[termIndex];
            extractedTerm.courses.forEach(extractedCourse => {
                const code = extractedCourse.code ? extractedCourse.code.toUpperCase().replace(/\s/g, '') : '';
                const name = extractedCourse.name ? extractedCourse.name.toUpperCase() : '';
                const grade = extractedCourse.grade ? extractedCourse.grade.toUpperCase() : '';
                if (!code && !name) return;
                let course = term.courses.find(c => c.code === code);
                if (!course && name) {
                    course = term.courses.find(c => c.name.toUpperCase().includes(name) || name.includes(c.name.toUpperCase()));
                }
                if (course) {
                    if (grade && gradeMap[grade] !== undefined) {
                        if (!course.actualGrade) course.actualGrade = grade;
                        if (!course.targetGrade) course.targetGrade = grade;
                    }
                    if (code && course.name !== code) {
                        course.name = code;
                    }
                } else {
                    const existingCustom = term.courses.find(c => c.name.toUpperCase() === name && (!c.code || c.code === code));
                    if (!existingCustom) {
                        let credits = findCreditsForCourse(code);
                        if (!credits && extractedCourse.credits) credits = parseFloat(extractedCourse.credits);
                        if (!credits) credits = 3;
                        const displayName = code || extractedCourse.name || 'Unknown';
                        term.courses.push({
                            id: Math.random().toString(36).substr(2, 9),
                            code: code,
                            name: displayName,
                            isElective: false,
                            credits: credits,
                            actualGrade: grade,
                            targetGrade: grade,
                            basketName: null
                        });
                    }
                }
            });
            term.courses = term.courses.filter(c => c.code || c.actualGrade || c.targetGrade);
        });
        setTerms(newTerms);
        setTimeout(() => {
            calculateStats();
        }, 100);
    };

    // Use extracted hooks
    const termManagement = useTermManagement(terms, setTerms);
    const dataPersistence = useDataPersistence(
        user, regNo, currentTerm, termVariant, terms, stats,
        setTerms, setCurrentTerm, setTermVariant, createTermFromSchema
    );

    useEffect(() => {
        if (user) {
            const regResult = user.user_metadata?.registration_number;
            setRegNo(regResult || '');
            dataPersistence.loadData(initializeTerms);
        } else {
            initializeTerms(1, 'COURSEWORK_VARIANT');
        }
    }, [user]);

    useEffect(() => {
        calculateStats();
    }, [terms]);

    useEffect(() => {
        if (!user || !terms || terms.length === 0) return;
        const timeoutId = setTimeout(() => {
            dataPersistence.saveData(true);
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [stats]);

    useEffect(() => {
        const handleGlobalLoad = () => dataPersistence.loadData(initializeTerms);
        const handleGlobalSave = () => dataPersistence.saveData();
        window.addEventListener('globalLoad', handleGlobalLoad);
        window.addEventListener('globalSave', handleGlobalSave);
        return () => {
            window.removeEventListener('globalLoad', handleGlobalLoad);
            window.removeEventListener('globalSave', handleGlobalSave);
        };
    }, [terms, currentTerm, termVariant, regNo, stats, user]);

    return {
        terms,
        currentTerm,
        termVariant,
        regNo,
        loading: dataPersistence.loading,
        stats,
        handleCourseChange: termManagement.handleCourseChange,
        handleDeleteCourse: termManagement.handleDeleteCourse,
        handleDeleteTerm: termManagement.handleDeleteTerm,
        handleAddCourse: termManagement.handleAddCourse,
        handleAddTerm,
        calculateStats,
        saveData: dataPersistence.saveData,
        fillExtractedData
    };
}
