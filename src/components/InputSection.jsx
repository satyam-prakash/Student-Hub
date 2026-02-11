import React from 'react';
import SubjectInputRow from './SubjectInputRow';
import ScheduleDayCard from './ScheduleDayCard';
import HolidayManager from './HolidayManager';

export default function InputSection({
    subjects, setSubjects,
    schedule, setSchedule,
    holidays, setHolidays,
    lastDate, setLastDate,
    onCalculate,
    todayIncluded, setTodayIncluded
}) {
    const addSubject = () => setSubjects([...subjects, { name: '', attended: 0, dutyLeave: 0, total: 0 }]);

    const deleteSubject = (index) => {
        const subjectToDelete = subjects[index];
        const newSubjects = subjects.filter((_, i) => i !== index);
        setSubjects(newSubjects);

        // Remove the subject from all schedule days
        if (subjectToDelete.name) {
            const newSchedule = { ...schedule };
            Object.keys(newSchedule).forEach(day => {
                newSchedule[day] = newSchedule[day].filter(s => s.name !== subjectToDelete.name);
            });
            setSchedule(newSchedule);
        }
    };

    const updateSubject = (index, field, value) => {
        const newSubjects = [...subjects];
        newSubjects[index][field] = value;
        setSubjects(newSubjects);
    };

    const toggleSchedule = (day, subjectName) => {
        const daySchedule = schedule[day];
        const exists = daySchedule.some(s => s.name === subjectName);

        if (exists) {
            setSchedule({ ...schedule, [day]: daySchedule.filter(s => s.name !== subjectName) });
        } else {
            setSchedule({ ...schedule, [day]: [...daySchedule, { name: subjectName, count: 1 }] });
        }
    };

    const updateScheduleCount = (day, subjectName, count) => {
        const daySchedule = schedule[day];
        const updated = daySchedule.map(s => s.name === subjectName ? { ...s, count } : s);
        setSchedule({ ...schedule, [day]: updated });
    };

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Subjects Section */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(255, 102, 0, 0.2)', color: 'var(--primary)', fontSize: '0.875rem' }}>1</span>
                    Subjects & Current Status
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Column Headers */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0 1rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div style={{ flex: '2 1 200px' }}>Subject Name</div>
                        <div style={{ display: 'flex', flex: '1 1 300px', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>Attended</div>
                            <div style={{ flex: 1 }}>Duty Leave</div>
                            <div style={{ flex: 1 }}>Total</div>
                        </div>
                    </div>
                    {subjects.map((sub, idx) => (
                        <SubjectInputRow key={idx} subject={sub} index={idx} onUpdate={updateSubject} onDelete={deleteSubject} />
                    ))}
                    <button onClick={addSubject} className="btn-secondary" style={{ width: '100%', maxWidth: 'max-content' }}>
                        + Add Subject
                    </button>
                </div>
            </div>

            {/* Weekly Schedule Section */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(255, 102, 0, 0.2)', color: 'var(--primary)', fontSize: '0.875rem' }}>2</span>
                    Weekly Schedule
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', marginLeft: '2.75rem' }}>Select which subjects occur on which days and how many classes.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {weekDays.map(day => (
                        <ScheduleDayCard
                            key={day}
                            day={day}
                            subjects={subjects}
                            schedule={schedule}
                            onToggle={toggleSchedule}
                            onUpdateCount={updateScheduleCount}
                        />
                    ))}
                </div>
            </div>

            {/* Details Section */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(255, 102, 0, 0.2)', color: 'var(--primary)', fontSize: '0.875rem' }}>3</span>
                    Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Last Date of Class</label>
                        <input
                            type="date"
                            value={lastDate}
                            onChange={e => setLastDate(e.target.value)}
                            style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <HolidayManager holidays={holidays} setHolidays={setHolidays} />
                </div>

                <div style={{ marginTop: '1.5rem', background: 'rgba(255, 102, 0, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 102, 0, 0.2)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={todayIncluded}
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                    if (window.confirm("WARNING: Make sure you have entered all the data till today.\n\nOnly check this if you have already updated the 'Attended' and 'Total' counts to include today's classes.\n\nThe calculator will assume today's data is already final and will start projecting from TOMORROW.")) {
                                        setTodayIncluded(true);
                                    }
                                } else {
                                    setTodayIncluded(false);
                                }
                            }}
                            style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                        <div>
                            <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>Today's classes already included in stats?</span>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Check this ONLY if you have already updated your subject attendance with today's numbers. If checked, projection starts from tomorrow.
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            <button
                onClick={onCalculate}
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', marginTop: '1rem' }}
            >
                Calculate Projection
            </button>
        </div>
    );
}
