import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { curriculum } from '../utils/cgpaLogic';

export function useDataPersistence(user, regNo, currentTerm, termVariant, terms, stats, setTerms, setCurrentTerm, setTermVariant, createTermFromSchema) {
    const [loading, setLoading] = useState(false);

    const saveData = async (silent = false) => {
        if (!user || (!regNo && !user.user_metadata?.registration_number)) {
            if (!silent) alert("Please login and ensure Registration Number is set.");
            return;
        }
        setLoading(true);
        const finalRegNo = regNo || user.user_metadata?.registration_number;
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
        try {
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
                ({ error } = await supabase
                    .from('student_cgpa_data')
                    .update(dataToSave)
                    .eq('user_id', user.id));
            } else {
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

    const loadData = async (initializeTerms) => {
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
                                } else {
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

    return {
        loading,
        saveData,
        loadData
    };
}
