import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
    curriculum,
    gradeMap,
    computeTermTGPA,
    getCategoryForCourse
} from '../utils/cgpaLogic';
import { useMediaQuery } from '../utils/useMediaQuery';
import { Save, Download, Loader2, Trash2, Plus, Calculator, Upload, X, Image as ImageIcon } from 'lucide-react';

// Simple Circular Progress Component - Value centered inside circle
const CircularProgress = ({ value, max, color, size = 100 }) => {
    const [progress, setProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(value), 50);
        return () => clearTimeout(timer);
    }, [value]);

    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ((progress / max) * circumference);

    // Hover effects
    const currentStrokeWidth = isHovered ? 4 : 8; // "Link get thin"
    const textScale = isHovered ? 1.2 : 1; // "Text pop out"

    return (
        <div
            style={{ position: 'relative', width: size, height: size, cursor: 'default' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: 'rotate(-90deg)',
                    overflow: 'visible' // Ensure stroke doesn't get clipped if it gets larger, though here getting smaller
                }}
            >
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke="var(--border)"
                    strokeWidth={currentStrokeWidth}
                    fill="transparent"
                    style={{ transition: 'stroke-width 0.3s ease-in-out' }}
                />
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke={color}
                    strokeWidth={currentStrokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dashoffset 1s ease-out, stroke-width 0.3s ease-in-out'
                    }}
                />
            </svg>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    pointerEvents: 'none' // Let mouse events pass to parent
                }}
            >
                <span
                    style={{
                        fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                        fontWeight: 'bold',
                        color: 'var(--text)',
                        textAlign: 'center',
                        transform: `scale(${textScale})`,
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy pop
                    }}
                >
                    {typeof value === 'number' ? value.toFixed(2) : '0.00'}
                </span>
            </div>
        </div>
    );
};

export default function CGPACalculator() {
    const { user } = useAuth();
    const [terms, setTerms] = useState([]);
    const [currentTerm, setCurrentTerm] = useState(1);
    const [termVariant, setTermVariant] = useState('COURSEWORK_VARIANT');
    const [regNo, setRegNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ actualCGPA: 0, targetCGPA: 0, totalCredits: 0 });
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Upload State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [uploadedScreenshots, setUploadedScreenshots] = useState([]);
    const [isDragging, setIsDragging] = useState(false);



    useEffect(() => {
        if (user) {
            const regResult = user.user_metadata?.registration_number;
            setRegNo(regResult || '');
            loadData();
        } else {
            initializeTerms(1, 'COURSEWORK_VARIANT');
        }
    }, [user]);

    // Auto-calculate stats when terms change
    useEffect(() => {
        calculateStats();
    }, [terms]);

    // Auto-save with debounce when stats change (after calculation)
    useEffect(() => {
        if (!user || !terms || terms.length === 0) return;

        const timeoutId = setTimeout(() => {
            saveData(true); // true = silent save
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
    }, [stats]);

    // Listen for global Load/Save events from header
    useEffect(() => {
        const handleGlobalLoad = () => loadData();
        const handleGlobalSave = () => saveData();

        window.addEventListener('globalLoad', handleGlobalLoad);
        window.addEventListener('globalSave', handleGlobalSave);

        return () => {
            window.removeEventListener('globalLoad', handleGlobalLoad);
            window.removeEventListener('globalSave', handleGlobalSave);
        };
    }, [terms, currentTerm, termVariant, regNo, stats, user]);

    const initializeTerms = (maxTerm, variant) => {
        const newTerms = [];
        for (let t = 1; t <= maxTerm; t++) {
            newTerms.push(createTermFromSchema(t, variant));
        }
        setTerms(newTerms);
    };

    const createTermFromSchema = (termNum, variant) => {
        const schema = curriculum[String(termNum)];
        const entries = (termNum === 7 || termNum === 8)
            ? schema?.[variant || 'COURSEWORK_VARIANT']
            : schema;

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

        return {
            termNumber: termNum,
            courses: courses
        };
    };

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
            setCurrentTerm(newTerms.length || 1);
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

    const handleAddTerm = () => {
        const nextTermNum = terms.length + 1;
        let newTerm = createTermFromSchema(nextTermNum, termVariant);
        if (!newTerm) {
            newTerm = { termNumber: nextTermNum, courses: [] };
        }

        // Create the new full list temporarily
        const updatedTerms = [...terms, newTerm];

        // Scan for active minors to auto-fill the new term
        // We look for ANY existing minor course selections to propagate them to the new term
        const processedCategories = new Set();

        updatedTerms.forEach(t => {
            t.courses.forEach(c => {
                // Check if this course has a code and belongs to a minor/elective basket
                if (c.code && c.basketName && (c.basketName.includes('MINOR') || c.basketName.includes('PATHWAY'))) {
                    const cat = getCategoryForCourse(c.code);
                    // If we found a valid category and haven't processed it yet...
                    if (cat && !processedCategories.has(cat.name)) {
                        processedCategories.add(cat.name);
                        // Trigger the auto-selection logic using this existing course as the "seed"
                        autoSelectRelatedCourses(updatedTerms, 0, c.basketName, c.code);
                    }
                }
            });
        });

        setTerms(updatedTerms);
        setCurrentTerm(nextTermNum);
    };

    const autoSelectRelatedCourses = (termsList, sourceTermIndex, basketName, selectedCode) => {
        // console.log('AutoSelect triggered:', { basketName, selectedCode });
        const category = getCategoryForCourse(selectedCode);
        // console.log('Category found:', category);

        if (!category) return; // Exit if no category identified

        // Initialize usedCodes with the USER SELECTED code to ensure it's locked and not duplicated
        // We use a Set to track all codes that are "claimed" by the enforcing logic.
        const usedCodes = new Set([selectedCode]);

        // Iterate through ALL terms to enforce the "Minor Theme"
        for (let i = 0; i < termsList.length; i++) {
            const term = termsList[i];

            term.courses.forEach(course => {
                if (!course.isElective) return;

                // Logic:
                // 1. If this slot allows the selected Minor Category (e.g. Data Science)...
                // 2. We try to find a valid course from that Category.
                // 3. We OVERWRITE the current value if a valid minor course is found (Enforcing the theme).
                // 4. We mark the code as used.

                if (course.basketName.includes('ENGINEERING_MINOR') || course.basketName.includes('PATHWAY') || course.basketName.includes('OPEN_MINOR')) {
                    // STRICT TYPE CHECKING: preventing Open Minor from filling Engineering Minor slots and vice versa
                    // We check if the basket name matches the category type we are propagating
                    let isCompatible = false;
                    if (category.type === 'ENGINEERING_MINOR' && course.basketName.includes('ENGINEERING_MINOR')) isCompatible = true;
                    if (category.type === 'OPEN_MINOR' && course.basketName.includes('OPEN_MINOR')) isCompatible = true;
                    if (category.type === 'PATHWAY' && course.basketName.includes('PATHWAY')) isCompatible = true;

                    if (isCompatible) {
                        // Try to find a match for the target category
                        const match = course.options.find(opt =>
                            category.courses.includes(opt) && !usedCodes.has(opt)
                        );

                        if (match) {
                            // Found a valid course for this minor!
                            // Check if this IS the source course (don't overwrite user's direct action)
                            // Note: usedCodes has selectedCode. "match" call above checked !usedCodes.has(opt).
                            // So "match" will ONLY be found for *other* slots or *other* courses.
                            // This naturally protects the source course from being overwritten by ITSELF (which is fine) 
                            // or by another random course.

                            // console.log(`Auto-filling Term ${i+1}, ${course.basketName} with ${match}`);
                            course.code = match; // FORCED OVERWRITE to ensure consistency
                            usedCodes.add(match);
                        } else {
                            // No unique match found for this category in this slot? 
                            // If the slot currently holds a code that is valid, add it to usedCodes 
                            if (course.code) usedCodes.add(course.code);
                        }
                    } else {
                        // Not a compatible minor slot? Just track its code usage.
                        if (course.code) usedCodes.add(course.code);
                    }
                } else {
                    // Not a minor slot? Just track its code usage.
                    if (course.code) usedCodes.add(course.code);
                }

            });
        }
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

    const saveData = async (silent = false) => {
        if (!user || (!regNo && !user.user_metadata?.registration_number)) {
            if (!silent) alert("Please login and ensure Registration Number is set.");
            return;
        }
        setLoading(true);

        const finalRegNo = regNo || user.user_metadata?.registration_number;

        // Validate that we have terms data to save
        if (!terms || terms.length === 0) {
            if (!silent) alert("No term data to save. Please add at least one term first.");
            setLoading(false);
            return;
        }

        const dataToSave = {
            user_id: user.id,
            registration_number: finalRegNo,
            current_term: currentTerm,
            term_variant: termVariant,
            terms_data: terms.map(t => ({
                termNumber: t.termNumber,
                courses: t.courses.map(c => ({
                    code: c.code,
                    name: c.name,
                    actualGrade: c.actualGrade,
                    targetGrade: c.targetGrade,
                    credits: c.credits,
                    basketName: c.basketName || null
                }))
            })),
            cgpa: stats.actualCGPA,
            updated_at: new Date().toISOString()
        };

        console.log('Saving CGPA data:', dataToSave);

        try {
            // First, check if a record exists for this user
            const { data: existingData, error: fetchError } = await supabase
                .from('student_cgpa_data')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            let error;
            if (existingData) {
                // Update existing record
                ({ error } = await supabase
                    .from('student_cgpa_data')
                    .update(dataToSave)
                    .eq('user_id', user.id));
            } else {
                // Insert new record
                ({ error } = await supabase
                    .from('student_cgpa_data')
                    .insert(dataToSave));
            }

            if (error) throw error;
            if (!silent) console.log('CGPA data saved successfully');
        } catch (e) {
            console.error(e);
            if (!silent) alert("Error saving data.");
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_cgpa_data')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                let maxTerm = data.current_term || 1;
                if (data.terms_data && Array.isArray(data.terms_data)) {
                    const maxInArray = data.terms_data.reduce((max, t) => Math.max(max, t.termNumber || 0), 0);
                    if (maxInArray > maxTerm) maxTerm = maxInArray;
                }

                const variant = data.term_variant || 'COURSEWORK_VARIANT';
                setCurrentTerm(maxTerm);
                setTermVariant(variant);

                const loadedTerms = [];
                const savedTermsMap = new Map(data.terms_data?.map(t => [t.termNumber, t]));

                for (let t = 1; t <= maxTerm; t++) {
                    const schema = curriculum[String(t)];
                    const schemaEntries = (t === 7 || t === 8) ? schema?.[variant] : schema;

                    const savedTerm = savedTermsMap.get(t);

                    if (savedTerm && savedTerm.courses && savedTerm.courses.length > 0) {
                        const reconstructedCourses = savedTerm.courses.map(savedCourse => {
                            let enrichedCourse = {
                                id: Math.random().toString(36).substr(2, 9),
                                code: savedCourse.code || '',
                                name: savedCourse.name || savedCourse.code || 'Unknown Course',
                                isElective: false,
                                credits: savedCourse.credits,
                                actualGrade: savedCourse.actualGrade,
                                targetGrade: savedCourse.targetGrade,
                                basketName: savedCourse.basketName
                            };

                            if (schemaEntries) {
                                if (savedCourse.code && schemaEntries[savedCourse.code]) {
                                    enrichedCourse.name = savedCourse.code;
                                    enrichedCourse.isElective = false;
                                }
                                else {
                                    let foundBasket = null;
                                    if (savedCourse.basketName && schemaEntries[savedCourse.basketName + '_BASKET']) {
                                        foundBasket = savedCourse.basketName;
                                    } else if (savedCourse.code) {
                                        Object.keys(schemaEntries).forEach(key => {
                                            if (key.endsWith('_BASKET')) {
                                                const options = Object.keys(schemaEntries[key]);
                                                if (options.includes(savedCourse.code)) {
                                                    foundBasket = key.replace('_BASKET', '');
                                                }
                                            }
                                        });
                                    }

                                    if (foundBasket) {
                                        const basketKey = foundBasket + '_BASKET';
                                        const options = Object.keys(schemaEntries[basketKey])
                                            .filter(k => schemaEntries[basketKey][k].credit || schemaEntries[basketKey][k].note)
                                            .map(k => k);

                                        enrichedCourse.isElective = true;
                                        enrichedCourse.basketName = foundBasket;
                                        enrichedCourse.name = foundBasket.replace(/_/g, ' ');
                                        enrichedCourse.options = options;
                                    }
                                }
                            }
                            return enrichedCourse;
                        });

                        loadedTerms.push({
                            termNumber: t,
                            courses: reconstructedCourses
                        });
                    } else {
                        loadedTerms.push(createTermFromSchema(t, variant));
                    }
                }
                setTerms(loadedTerms);
            } else {
                initializeTerms(1, 'COURSEWORK_VARIANT');
            }
        } catch (e) {
            console.error(e);
            initializeTerms(1, 'COURSEWORK_VARIANT');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to find credits for a course code in curriculum
    const findCreditsForCourse = (courseCode) => {
        if (!courseCode) return null;

        // Search through all terms in curriculum
        for (const term in curriculum) {
            const termData = curriculum[term];

            // Check direct course codes
            if (termData[courseCode] && termData[courseCode].credit) {
                return termData[courseCode].credit;
            }

            // Check inside basket electives
            for (const key in termData) {
                if (key.includes('BASKET') && termData[key][courseCode]) {
                    return termData[key][courseCode].credit;
                }
            }
        }

        return null; // Not found in curriculum
    };

    const fillExtractedData = async (data) => {
        if (!data || !data.terms) return;

        const newTerms = [...terms];

        // Ensure we have enough terms
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

        // Process each extracted term
        data.terms.forEach(extractedTerm => {
            const termIndex = newTerms.findIndex(t => t.termNumber === extractedTerm.termNumber);
            if (termIndex === -1) return;

            const term = newTerms[termIndex];

            extractedTerm.courses.forEach(extractedCourse => {
                // normalize code
                const code = extractedCourse.code ? extractedCourse.code.toUpperCase().replace(/\s/g, '') : '';
                const name = extractedCourse.name ? extractedCourse.name.toUpperCase() : '';
                const grade = extractedCourse.grade ? extractedCourse.grade.toUpperCase() : '';

                if (!code && !name) return;

                // Try to find matching course
                let course = term.courses.find(c => c.code === code);

                // Fuzzy match by name if code match fails
                if (!course && name) {
                    course = term.courses.find(c => c.name.toUpperCase().includes(name) || name.includes(c.name.toUpperCase()));
                }

                if (course) {
                    // Update existing course
                    if (grade && gradeMap[grade] !== undefined) {
                        if (!course.actualGrade) course.actualGrade = grade;
                        if (!course.targetGrade) course.targetGrade = grade;
                    }
                    // Force name to be code if available (User preference)
                    if (code && course.name !== code) {
                        course.name = code;
                    }
                } else {
                    // Check if it already exists as a custom course to avoid dupes 
                    const existingCustom = term.courses.find(c => c.name.toUpperCase() === name && (!c.code || c.code === code));

                    if (!existingCustom) {
                        // Find credits for the new course
                        let credits = findCreditsForCourse(code);
                        if (!credits && extractedCourse.credits) credits = parseFloat(extractedCourse.credits);
                        if (!credits) credits = 3; // Default fallback

                        // User requested: "dont wtite the complte cousre name only coure code"
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

            // Clean up: Remove empty placeholder rows that remained unfilled
            // We keep courses that have a code OR a grade.
            // This removes "Select Elective" rows (which have code='' and no grade)
            term.courses = term.courses.filter(c => c.code || c.actualGrade || c.targetGrade);
        });

        setTerms(newTerms);
        // Trigger save/recalc via effect
        setTimeout(() => {
            calculateStats();
        }, 100);
    };

    const handleScreenshotUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress(10);
        setProgressText('Uploading images...');
        setShowUploadModal(true); // Ensure modal is open if triggered by drop

        const newScreenshots = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            await new Promise((resolve) => {
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    newScreenshots.push({
                        file: file,
                        data: imageData,
                        base64: imageData.split(',')[1]
                    });
                    resolve();
                };
                reader.readAsDataURL(file);
            });

            setUploadProgress(10 + ((i + 1) / files.length) * 30);
        }

        setUploadedScreenshots(prev => [...prev, ...newScreenshots]);
        setUploading(false);
        setUploadProgress(0);
    };

    const removeUploadedImage = (index) => {
        setUploadedScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const processScreenshotsWithGemini = async () => {
        if (uploadedScreenshots.length === 0) {
            alert("Please upload at least one screenshot first.");
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setProgressText('Initializing AI...');

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                alert('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
                setUploading(false);
                return;
            }

            setUploadProgress(20);
            setProgressText('Analyzing screenshots...');

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const parts = [
                {
                    text: `You are an expert at extracting academic grade data from screenshots. 
                    
Analyze these grade sheet screenshots and extract all course information. For each course, identify:
1. Course code (e.g., CSE101, MAT201, INT108, etc.)
2. Course name/title
3. Grade received (O, A+, A, B+, B, C, D, E, F, G, or I for incomplete)

NOTE: Do NOT try to extract credits/credit hours - they are not visible in these screenshots.

Return the data in this exact JSON format:
{
  "terms": [
    {
      "termNumber": 1,
      "courses": [
        {
          "code": "CSE101",
          "name": "ORIENTATION TO COMPUTING-I",
          "grade": "A+"
        },
        {
          "code": "INT108",
          "name": "PYTHON PROGRAMMING",
          "grade": "A+"
        }
      ]
    }
  ]
}

Important:
- Group courses by term/semester based on the "Semester:" header (I, II, III, IV, etc.)
- Extract the semester number from headers like "Semester:I" (1), "Semester:II" (2), etc.
- Only use valid grades: O, A+, A, B+, B, C, D, E, F, G, I
- Extract ALL courses visible in the images
- Do NOT include credits field
- Return ONLY valid JSON, no additional text`
                }
            ];

            uploadedScreenshots.forEach((screenshot) => {
                parts.push({
                    inlineData: {
                        mimeType: screenshot.file.type,
                        data: screenshot.base64
                    }
                });
            });

            const requestBody = {
                contents: [{
                    parts: parts
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 4096,
                }
            };

            setUploadProgress(40);

            // Retry logic
            let retries = 0;
            const maxRetries = 3;
            let result;

            while (retries <= maxRetries) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });

                    if (response.status === 429) {
                        retries++;
                        if (retries > maxRetries) throw new Error('Rate limit exceeded. Please wait a few minutes and try again with fewer images.');
                        const waitTime = Math.pow(2, retries) * 1000;
                        setProgressText(`Rate limit hit. Retrying in ${waitTime / 1000}s...`);
                        await new Promise(r => setTimeout(r, waitTime));
                        continue;
                    }

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
                    }

                    result = await response.json();
                    break;
                } catch (err) {
                    if (retries >= maxRetries) throw err;
                    retries++;
                    const waitTime = Math.pow(2, retries) * 1000;
                    setProgressText(`Connection error. Retrying in ${waitTime / 1000}s...`);
                    await new Promise(r => setTimeout(r, waitTime));
                }
            }

            setUploadProgress(80);
            setProgressText('Processing data...');

            const generatedText = result.candidates[0].content.parts[0].text;
            let jsonText = generatedText.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
            }

            const extractedData = JSON.parse(jsonText);

            setUploadProgress(90);
            setProgressText('Filling grades...');

            await fillExtractedData(extractedData);

            setUploadProgress(100);
            setProgressText('Complete! Data has been filled in.');

            setTimeout(() => {
                setUploading(false);
                setShowUploadModal(false);
                setUploadedScreenshots([]);
                alert('Successfully extracted and filled data from screenshots!');
            }, 2000);

        } catch (error) {
            console.error(error);
            let errorMessage = error.message;
            if (errorMessage.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please wait a few minutes.';
            } else if (errorMessage.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            alert(`Error: ${errorMessage}`);
            setUploading(false);
        }
    };

    return (

        <>
            {/* Fixed Action Buttons - Always Visible */}
            <div
                style={{
                    position: 'fixed',
                    top: isMobile ? 'auto' : '80px',
                    bottom: isMobile ? '20px' : 'auto',
                    right: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '12px'
                }}
            >
                <button
                    onClick={() => {
                        calculateStats();
                        setTimeout(() => saveData(true), 500); // Auto-save after calculation
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, var(--primary), #ff4500)',
                        border: 'none',
                        padding: '0.7rem 0.7rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 10px 40px rgba(255, 102, 0, 0.3)'
                    }}
                    className="shadow-xl"
                >
                    <Calculator size={16} />
                    <span>Calculate CGPA</span>
                </button>

                <button
                    onClick={() => setShowUploadModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #9333ea 0%, #7928ca 100%)',
                        border: 'none',
                        padding: '0.7rem 0.7rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 10px 40px rgba(147, 51, 234, 0.3)'
                    }}
                    className="shadow-xl"
                >
                    <Upload size={16} />
                    <span>Upload Grades</span>
                </button>
            </div >

            <div className="max-w-7xl mx-auto pb-12 px-4">
                <header className="mb-8 text-center animate-fade-in relative">
                    <h1 className="font-bold mb-4 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--text), var(--text-secondary))', fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
                        CGPA Calculator
                    </h1>
                    <p className="" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 3vw, 1.125rem)' }}>
                        Plan your academic journey term by term
                    </p>
                </header>

                {/* Stats Section - Clean Horizontal Layout */}
                <div className="mb-8 overflow-x-auto pb-4">
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            justifyContent: 'center',
                            width: '100%'
                        }}
                    >
                        {/* Actual CGPA */}
                        <div className="rounded-2xl p-4 flex flex-col items-center" style={{ minWidth: '150px', background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <CircularProgress
                                value={stats.actualCGPA}
                                max={10}
                                color="var(--primary)"
                                size={120}
                            />
                            <h3 className="font-bold mt-4" style={{ color: 'var(--text)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Actual CGPA</h3>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cumulative</span>
                        </div>

                        {/* Target CGPA */}
                        <div className="rounded-2xl p-4 flex flex-col items-center" style={{ minWidth: '150px', background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <CircularProgress
                                value={stats.targetCGPA}
                                max={10}
                                color="#22c55e"
                                size={120}
                            />
                            <h3 className="font-bold mt-4" style={{ color: 'var(--text)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Target CGPA</h3>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Projected</span>
                        </div>

                        {/* All Term TGPAs - Hidden on Mobile */}
                        {!isMobile && stats.termStats && stats.termStats.map((termStat, idx) => (
                            <div key={idx} className="rounded-2xl p-4 flex flex-col items-center" style={{ minWidth: '150px', background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                                <CircularProgress
                                    value={termStat.tgpa || 0}
                                    max={10}
                                    color="#3b82f6"
                                    size={120}
                                />
                                <h3 className="font-bold mt-4" style={{ color: 'var(--text)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Term {idx + 1} GPA</h3>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{termStat.totalCredits} Credits</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Terms List */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '300px' : '500px'}, 1fr))`, gap: '2rem', marginTop: '3rem', paddingBottom: isMobile ? '100px' : '0' }}>
                    {terms.map((term, tIndex) => (
                        <div key={term.termNumber} className="card animate-fade-in relative border-t-4 border-t-primary/20" style={{ animationDelay: tIndex * 0.1 + 's' }}>
                            <div className="flex justify-between items-center mb-6 pl-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="font-bold" style={{ color: 'var(--text)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
                                    Term {term.termNumber}
                                </h2>

                                <div className="flex items-center gap-2" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                                    {/* Updated TGPA Display - Actual vs Target */}
                                    <div className="flex items-center" style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                                        {/* Actual */}
                                        <div className="flex flex-col items-center">
                                            <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5" style={{ color: 'var(--text-secondary)' }}>Actual</div>
                                            <div className="text-xl font-bold leading-none" style={{ color: '#3B82F6' }}>
                                                {stats.termStats && stats.termStats[tIndex]?.tgpa
                                                    ? stats.termStats[tIndex].tgpa.toFixed(2)
                                                    : '0.00'
                                                }
                                            </div>
                                        </div>

                                        {/* Target */}
                                        <div className="flex flex-col items-center">
                                            <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5 text-green-500/80">Target</div>
                                            <div className="text-xl font-bold leading-none" style={{ color: '#34D399' }}>
                                                {stats.targetTermStats && stats.targetTermStats[tIndex]?.tgpa
                                                    ? stats.targetTermStats[tIndex].tgpa.toFixed(2)
                                                    : '0.00'
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px mx-1" style={{ backgroundColor: 'var(--border)' }}></div>

                                    <button
                                        onClick={() => handleDeleteTerm(tIndex)}
                                        className="transition-colors hover:bg-red-500/10 rounded-lg p-2"
                                        style={{ color: 'var(--error)', border: 'none', background: 'transparent' }}
                                        title="Delete Term"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto mb-4">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wider border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium`} style={{ width: isMobile ? '35%' : '40%' }}>{isMobile ? 'Subject' : 'Subject / Elective'}</th>
                                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '13%' : '13%' }}>Cr</th>
                                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '21%' : '19%' }}>{isMobile ? 'Grd' : 'Actual'}</th>
                                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '21%' : '19%' }}>{isMobile ? 'Tgt' : 'Target'}</th>
                                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '10%' : '9%' }}>{isMobile ? '' : 'Act'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && terms.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                                                    <Loader2 className="animate-spin inline-block mr-2" /> Loading...
                                                </td>
                                            </tr>
                                        )}
                                        {term.courses.map((course, cIndex) => (
                                            <tr key={course.id} className="transition-colors group hover:bg-white/5" style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td className="py-2 px-1 align-middle">
                                                    {course.isElective ? (
                                                        <select
                                                            value={course.code}
                                                            onChange={(e) => handleCourseChange(tIndex, cIndex, 'code', e.target.value)}
                                                            className="rounded px-2 py-1 text-xs w-full focus:border-primary outline-none"
                                                            style={{
                                                                background: 'var(--input-bg)',
                                                                border: '1px solid var(--border)',
                                                                color: 'var(--text)'
                                                            }}
                                                        >
                                                            <option value="">{course.name}</option>
                                                            {course.options?.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={course.name}
                                                            onChange={(e) => handleCourseChange(tIndex, cIndex, 'name', e.target.value)}
                                                            placeholder="Subject Name"
                                                            className="bg-transparent border-none p-0 font-medium focus:ring-0 w-full"
                                                            style={{ color: 'var(--text)' }}
                                                        />
                                                    )}
                                                </td>

                                                <td className="py-2 px-1 align-middle text-center">
                                                    <input
                                                        type="number"
                                                        value={course.credits}
                                                        onChange={(e) => handleCourseChange(tIndex, cIndex, 'credits', parseInt(e.target.value) || 0)}
                                                        className={`rounded px-0.5 py-1 text-xs text-center focus:border-primary outline-none ${isMobile ? 'w-full' : 'w-12'}`}
                                                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: '0' }}
                                                    />
                                                </td>

                                                <td className="py-2 px-1 align-middle">
                                                    <select
                                                        value={course.actualGrade}
                                                        onChange={(e) => handleCourseChange(tIndex, cIndex, 'actualGrade', e.target.value)}
                                                        className={`rounded ${isMobile ? 'px-0' : 'px-1'} py-1 w-full text-xs focus:border-primary outline-none text-center ${isMobile ? 'appearance-none' : ''}`}
                                                        style={{
                                                            color: course.actualGrade ? 'var(--text)' : 'var(--text-secondary)',
                                                            background: 'var(--input-bg)',
                                                            border: '1px solid var(--border)',
                                                            paddingRight: isMobile ? '0' : undefined
                                                        }}
                                                    >
                                                        <option value="">{isMobile ? '-' : '-'}</option>
                                                        {Object.keys(gradeMap).map(g => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                    </select>
                                                </td>

                                                <td className="py-2 px-1 align-middle">
                                                    <select
                                                        value={course.targetGrade}
                                                        onChange={(e) => handleCourseChange(tIndex, cIndex, 'targetGrade', e.target.value)}
                                                        className={`rounded ${isMobile ? 'px-0' : 'px-1'} py-1 w-full text-xs focus:border-green-500/50 outline-none text-center ${isMobile ? 'appearance-none' : ''}`}
                                                        style={{
                                                            color: course.targetGrade ? '#4ade80' : 'var(--text-secondary)',
                                                            background: 'var(--input-bg)',
                                                            border: '1px solid var(--border)',
                                                            paddingRight: isMobile ? '0' : undefined
                                                        }}
                                                    >
                                                        <option value="">{isMobile ? '-' : '-'}</option>
                                                        {Object.keys(gradeMap).map(g => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                    </select>
                                                </td>

                                                <td className="py-2 px-1 align-middle text-center">
                                                    <button
                                                        onClick={() => handleDeleteCourse(tIndex, cIndex)}
                                                        className="w-8 h-8 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                                        style={{ color: '#ef4444', background: 'transparent', border: 'none' }}
                                                        title="Remove Subject"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                        }
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => handleAddCourse(tIndex)}
                                    className="text-xs font-medium flex items-center gap-1 transition-all py-2 px-4 rounded-full"
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#9ca3af'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                >
                                    <Plus size={14} /> Add Subject
                                </button>
                            </div>
                        </div>
                    ))}


                    {/* Add Term Button as Grid Item */}
                    {terms.length > 0 && (
                        <div className="card animate-fade-in relative border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center" style={{ minHeight: '300px' }}>
                            <button
                                onClick={handleAddTerm}
                                className="flex flex-col items-center justify-center gap-3 transition-colors"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                            >
                                <Plus size={48} />
                                <span className="text-xl font-semibold">Add Sem</span>
                            </button>
                        </div>
                    )}
                </div>

            </div >

            {/* Upload Modal */}
            {
                showUploadModal && (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(true);
                        }}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Only set to false if we're leaving the window/overlay
                            if (e.clientX <= 0 || e.clientY <= 0 || (e.relatedTarget === null && e.target.nodeName !== 'HTML')) {
                                setIsDragging(false);
                            }
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                            handleScreenshotUpload({ target: { files: e.dataTransfer.files } });
                        }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}>


                        {/* Global Drag Overlay */}
                        {isDragging && !uploading && (
                            <div
                                className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300 pointer-events-none"
                                style={{
                                    background: 'rgba(255, 102, 0, 0.4)', // Stronger background for clarity
                                    zIndex: 99999, // Ensure it's on top of everything
                                }}
                            >
                                <div className="text-center transform scale-110">
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary text-white shadow-2xl animate-bounce" style={{ background: 'var(--primary)' }}>
                                        <Upload size={48} />
                                    </div>
                                    <h3 className="text-4xl font-bold" style={{ color: 'var(--primary)', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                        Drop Anywhere!
                                    </h3>
                                </div>
                            </div>
                        )}

                        <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl max-w-4xl w-full mx-4 shadow-2xl relative animate-fade-in flex flex-col" style={{ maxHeight: '90vh', background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}>
                            {/* Header - Fixed at top */}
                            <div className="p-8 pb-4 border-b border-white/10 flex justify-between items-start" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Upload Grade Sheet</h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upload screenshots of your grade history. AI will extract your grades automatically.</p>
                                </div>
                                <button
                                    onClick={() => !uploading && setShowUploadModal(false)}
                                    className="transition-colors hover:scale-110 p-2 -mr-2 -mt-2 rounded-full"
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: '#dc2626', // Red
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-8 pt-6 overflow-y-auto custom-scrollbar relative">
                                {/* Drag Overlay */}


                                {/* Hidden Input - Moved outside to prevent event bubbling */}
                                <input
                                    type="file"
                                    id="screenshot-input"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleScreenshotUpload}
                                />

                                {!uploading ? (
                                    <div
                                        className="border-2 border-dashed rounded-xl py-20 px-16 text-center transition-all duration-300 cursor-pointer hover:border-primary/50"
                                        style={{
                                            borderColor: 'var(--border)',
                                            background: 'var(--input-bg)',
                                        }}
                                        onClick={() => document.getElementById('screenshot-input').click()}
                                    >


                                        {/* Icon with animation */}
                                        <div
                                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300"
                                            style={{
                                                background: 'rgba(255, 102, 0, 0.2)',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            <Upload
                                                size={32}
                                                style={{
                                                    color: isDragging ? '#ffffff' : 'var(--primary)',
                                                    transition: 'all 0.3s'
                                                }}
                                            />
                                        </div>

                                        <h3 className="text-lg font-semibold mb-2" style={{ color: isDragging ? 'var(--primary)' : 'var(--text)', pointerEvents: 'none' }}>
                                            {isDragging ? 'Drop your images here!' : 'Click to upload or drag and drop'}
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                                            Supports PNG, JPG (Max 5MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center text-center">
                                        {/* Large Percentage Display */}
                                        <div className="mb-6">
                                            <div
                                                className="text-6xl font-bold mb-2"
                                                style={{
                                                    color: 'var(--primary)',
                                                    textShadow: '0 0 20px rgba(255, 102, 0, 0.5)'
                                                }}
                                            >
                                                {Math.round(uploadProgress)}%
                                            </div>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Processing</p>
                                        </div>

                                        {/* Modern Progress Bar */}
                                        <div style={{ width: '100%', maxWidth: '500px', marginBottom: '32px' }}>
                                            <div
                                                style={{
                                                    height: '8px',
                                                    borderRadius: '999px',
                                                    overflow: 'hidden',
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    width: '100%',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: '999px',
                                                        transition: 'width 0.3s ease-out',
                                                        width: `${uploadProgress}%`,
                                                        background: 'linear-gradient(90deg, #ff6600 0%, #ff8533 50%, #ff6600 100%)',
                                                        boxShadow: '0 0 20px rgba(255, 102, 0, 0.6)',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {/* Animated shine effect */}
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: '-100%',
                                                            width: '100%',
                                                            height: '100%',
                                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                                            animation: 'shine 2s infinite'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Text */}
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                                                {progressText}
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                Please wait while we process your grade sheets...
                                            </p>
                                        </div>

                                        {/* Spinning loader icon - smaller and subtle */}
                                        <div className="mt-6">
                                            <Loader2
                                                className="animate-spin"
                                                size={32}
                                                style={{ color: 'var(--primary)', opacity: 0.6 }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Preview Area */}
                                {uploadedScreenshots.length > 0 && (
                                    <div className="mt-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Uploaded Images ({uploadedScreenshots.length})</h3>
                                            {!uploading && (
                                                <button
                                                    onClick={processScreenshotsWithGemini}
                                                    className="btn-primary py-2 px-6 text-sm flex items-center gap-2"
                                                >
                                                    <ImageIcon size={16} />
                                                    Process Images
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '384px', overflowY: 'auto', paddingRight: '8px' }}>
                                            {uploadedScreenshots.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative group rounded-lg overflow-hidden border bg-black/50"
                                                    style={{
                                                        border: '1px solid var(--border)',
                                                        width: '100px',
                                                        minWidth: '100px',
                                                        height: '100px',
                                                        position: 'relative' // Enforce relative for absolute children
                                                    }}
                                                >
                                                    <img
                                                        src={img.data}
                                                        alt={`Screenshot ${idx + 1}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />

                                                    {!uploading && (
                                                        <div
                                                            role="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeUploadedImage(idx);
                                                            }}
                                                            className="absolute z-50 hover:scale-110 transition-transform"
                                                            style={{
                                                                position: 'absolute',
                                                                top: '4px',
                                                                right: '4px',
                                                                width: '24px',
                                                                height: '24px',
                                                                backgroundColor: 'transparent',
                                                                color: '#dc2626', // Red Icon
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: 'none',
                                                                padding: 0,
                                                                cursor: 'pointer',
                                                                zIndex: 99999,
                                                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' // Subtle shadow for visibility
                                                            }}
                                                            title="Remove image"
                                                        >
                                                            <X size={20} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
