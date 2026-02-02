import { useState, useEffect } from 'react';
import InputSection from '../components/InputSection';
import ResultsSection from '../components/ResultsSection';
import { calculateAttendance } from '../utils/calculator';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Download, Loader2 } from 'lucide-react';

export default function AttendanceCalculator() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([{ name: '', attended: 0, dutyLeave: 0, total: 0 }]);
    const [schedule, setSchedule] = useState({
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
    });
    const [holidays, setHolidays] = useState([]);
    const [lastDate, setLastDate] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [regNo, setRegNo] = useState('');
    const [todayIncluded, setTodayIncluded] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Load data on mount if user exists
    useEffect(() => {
        if (user) {
            if (user.user_metadata?.registration_number) {
                setRegNo(user.user_metadata.registration_number);
            }
            // Only load data once per session to prevent resetting view on tab switch
            if (!initialLoadDone) {
                loadData();
                setInitialLoadDone(true);
            }
        } else {
            setInitialLoadDone(false);
        }
    }, [user, initialLoadDone]);

    // Listen for global Load/Save events from header
    useEffect(() => {
        const handleGlobalLoad = () => loadData();
        const handleGlobalSave = () => saveData(results, false);

        window.addEventListener('globalLoad', handleGlobalLoad);
        window.addEventListener('globalSave', handleGlobalSave);

        return () => {
            window.removeEventListener('globalLoad', handleGlobalLoad);
            window.removeEventListener('globalSave', handleGlobalSave);
        };
    }, [results]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('attendance_data')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setSubjects(data.subjects || []);
                setSchedule(data.schedule || {
                    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
                });
                setHolidays(data.holidays || []);
                setLastDate(data.last_date || '');
                setRegNo(data.reg_no || '');
                setTodayIncluded(data.today_included || false);

                // If results exist, show them directly
                if (data.results) {
                    setResults(data.results);
                } else if (data.last_date && data.subjects && data.subjects.length > 0) {
                    // If no results but data exists, calculate and show results
                    const startDate = data.today_included ? new Date(Date.now() + 86400000) : new Date();
                    const calculated = calculateAttendance(
                        data.subjects,
                        data.schedule,
                        data.holidays || [],
                        data.last_date,
                        startDate
                    );
                    setResults(calculated);
                }
            }
        } catch (err) {
            console.error('Error loading data:', err);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const saveData = async (resultsToSave = results, silent = false) => {
        if (!user) return;
        if (!regNo) {
            alert('Please enter your Registration Number to save data.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase
                .from('attendance_data')
                .upsert({
                    user_id: user.id,
                    reg_no: regNo,
                    subjects,
                    schedule,
                    holidays,
                    last_date: lastDate,
                    today_included: todayIncluded,
                    results: resultsToSave,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            if (!silent) alert('Data saved successfully!');
        } catch (err) {
            console.error('Error saving data:', err);
            if (!silent) alert('Failed to save data');
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = () => {
        if (!lastDate) {
            alert("Please select a last date of class.");
            return;
        }
        const startDate = todayIncluded ? new Date(Date.now() + 86400000) : new Date();
        const calculated = calculateAttendance(subjects, schedule, holidays, lastDate, startDate);
        setResults(calculated);
        saveData(calculated, true);
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <header className="mb-12 text-center animate-fade-in">
                <h1 className="text-5xl font-bold mb-4" style={{
                    background: 'linear-gradient(to right, var(--text), var(--text-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Attendance Calculator
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                    Track your progress and plan your semester effectively
                </p>
            </header>

            {!results ? (
                <InputSection
                    subjects={subjects} setSubjects={setSubjects}
                    schedule={schedule} setSchedule={setSchedule}
                    holidays={holidays} setHolidays={setHolidays}
                    lastDate={lastDate} setLastDate={setLastDate}
                    onCalculate={handleCalculate}
                    todayIncluded={todayIncluded} setTodayIncluded={setTodayIncluded}
                />
            ) : (
                <ResultsSection results={results} onReset={() => setResults(null)} inputs={subjects} />
            )}
        </div>
    );
}
