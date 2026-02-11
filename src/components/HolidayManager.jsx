import { useState } from 'react';

export default function HolidayManager({ holidays, setHolidays }) {
    const [showWarning, setShowWarning] = useState(false);

    const addHoliday = () => {
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
    };

    const removeHoliday = (date) => {
        setHolidays(holidays.filter(d => d !== date));
    };

    return (
        <div>
            <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem'
            }}>
                Holidays
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                    type="date"
                    id="holiday-picker"
                    onChange={() => setShowWarning(false)}
                    style={{
                        flex: 1,
                        background: 'var(--input-bg)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)'
                    }}
                />
                <button
                    onClick={addHoliday}
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
                <p style={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    marginTop: '-0.5rem',
                    marginBottom: '0.75rem',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    Please select a date first
                </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {holidays.map(h => (
                    <span
                        key={h}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--surface-hover)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.875rem',
                            border: '1px solid var(--border)'
                        }}
                    >
                        {h}
                        <button
                            onClick={() => removeHoliday(h)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: 0,
                                display: 'flex'
                            }}
                        >
                            &times;
                        </button>
                    </span>
                ))}
                {holidays.length === 0 && (
                    <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic'
                    }}>
                        No holidays added
                    </span>
                )}
            </div>
        </div>
    );
}
