import React, { useState } from 'react';

export default function InputSection({
    subjects, setSubjects,
    schedule, setSchedule,
    holidays, setHolidays,
    lastDate, setLastDate,
    onCalculate,
    todayIncluded, setTodayIncluded
}) {
    const [showWarning, setShowWarning] = useState(false);

    const addSubject = () => setSubjects([...subjects, { name: '', attended: 0, dutyLeave: 0, total: 0 }]);

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
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
                        <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                            <input
                                placeholder="Subject Name"
                                value={sub.name}
                                onChange={e => updateSubject(idx, 'name', e.target.value)}
                                style={{ flex: '2 1 200px', minWidth: '0', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
                            />
                            <div style={{ display: 'flex', flex: '1 1 300px', gap: '1rem' }}>
                                <input
                                    type="number"
                                    placeholder="Attended"
                                    value={sub.attended === 0 ? '' : sub.attended}
                                    onChange={e => updateSubject(idx, 'attended', e.target.value)}
                                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Duty Leave"
                                    value={sub.dutyLeave === 0 ? '' : sub.dutyLeave}
                                    onChange={e => updateSubject(idx, 'dutyLeave', e.target.value)}
                                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Total Classes"
                                    value={sub.total === 0 ? '' : sub.total}
                                    onChange={e => updateSubject(idx, 'total', e.target.value)}
                                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addSubject}
                        className="btn-secondary"
                        style={{ width: '100%', maxWidth: 'max-content' }}
                    >
                        + Add Subject
                    </button>
                </div>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(255, 102, 0, 0.2)', color: 'var(--primary)', fontSize: '0.875rem' }}>2</span>
                    Weekly Schedule
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', marginLeft: '2.75rem' }}>Select which subjects occur on which days and how many classes.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                            <h4 style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>{day}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {subjects.filter(s => s.name).map(sub => {
                                    const daySchedule = schedule[day] || [];
                                    const isSelected = daySchedule.some(s => s.name === sub.name);
                                    const currentCount = isSelected ? daySchedule.find(s => s.name === sub.name).count : 1;

                                    return (
                                        <div key={sub.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '0.5rem', background: isSelected ? 'rgba(255, 102, 0, 0.1)' : 'transparent', border: isSelected ? '1px solid rgba(255, 102, 0, 0.2)' : 'none' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, gap: '0.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSchedule(day, sub.name)}
                                                    style={{ width: '1rem', height: '1rem', flex: 'none' }}
                                                />
                                                <span style={{ fontSize: '0.875rem', color: isSelected ? 'var(--text)' : 'var(--text-secondary)', fontWeight: isSelected ? '500' : 'normal' }}>{sub.name}</span>
                                            </label>
                                            {isSelected && (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={currentCount}
                                                    onChange={(e) => updateScheduleCount(day, sub.name, parseInt(e.target.value) || 1)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ width: '4rem', padding: '0.25rem 0.5rem', textAlign: 'center', fontSize: '0.875rem', background: 'var(--surface)', borderColor: 'var(--primary)', color: 'var(--text)' }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                                {subjects.filter(s => s.name).length === 0 && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Add subjects first</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Holidays</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <input
                                type="date"
                                id="holiday-picker"
                                onChange={() => setShowWarning(false)}
                                style={{ flex: 1, background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                            />
                            <button
                                onClick={() => {
                                    const picker = document.getElementById('holiday-picker');
                                    const val = picker.value;
                                    if (val) {
                                        if (!holidays.includes(val)) {
                                            const newHolidays = [...holidays, val].sort();
                                            setHolidays(newHolidays);
                                            picker.value = '';
                                            if (navigator.vibrate) navigator.vibrate(50);
                                            setShowWarning(false);
                                        }
                                    } else {
                                        setShowWarning(true);
                                        if (navigator.vibrate) navigator.vibrate(200);
                                    }
                                }}
                                className="btn-secondary"
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: showWarning ? '1px solid #ef4444' : undefined,
                                    animation: showWarning ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : undefined
                                }}
                            >
                                Add
                            </button>
                        </div>
                        {showWarning && (
                            <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '0.75rem', animation: 'fadeIn 0.2s ease-out' }}>
                                Please select a date first
                            </p>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {holidays.map(h => (
                                <span key={h} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-hover)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', border: '1px solid var(--border)' }}>
                                    {h}
                                    <button
                                        onClick={() => setHolidays(holidays.filter(d => d !== h))}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', padding: 0, display: 'flex' }}
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                            {holidays.length === 0 && (
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No holidays added</span>
                            )}
                        </div>
                    </div>
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
