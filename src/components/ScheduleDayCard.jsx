export default function ScheduleDayCard({ day, subjects, schedule, onToggle, onUpdateCount }) {
    const daySchedule = schedule[day] || [];

    return (
        <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)'
        }}>
            <h4 style={{
                fontWeight: 'bold',
                fontSize: '1.125rem',
                marginBottom: '0.75rem',
                color: 'var(--primary)'
            }}>
                {day}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {subjects.filter(s => s.name).map(sub => {
                    const isSelected = daySchedule.some(s => s.name === sub.name);
                    const currentCount = isSelected ? daySchedule.find(s => s.name === sub.name).count : 1;

                    return (
                        <div
                            key={sub.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                background: isSelected ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                                border: isSelected ? '1px solid rgba(255, 102, 0, 0.2)' : 'none'
                            }}
                        >
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                flex: 1,
                                gap: '0.5rem'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onToggle(day, sub.name)}
                                    style={{ width: '1rem', height: '1rem', flex: 'none' }}
                                />
                                <span style={{
                                    fontSize: '0.875rem',
                                    color: isSelected ? 'var(--text)' : 'var(--text-secondary)',
                                    fontWeight: isSelected ? '500' : 'normal'
                                }}>
                                    {sub.name}
                                </span>
                            </label>
                            {isSelected && (
                                <input
                                    type="number"
                                    min="1"
                                    value={currentCount}
                                    onChange={(e) => onUpdateCount(day, sub.name, parseInt(e.target.value) || 1)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        width: '4rem',
                                        padding: '0.25rem 0.5rem',
                                        textAlign: 'center',
                                        fontSize: '0.875rem',
                                        background: 'var(--surface)',
                                        borderColor: 'var(--primary)',
                                        color: 'var(--text)'
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
                {subjects.filter(s => s.name).length === 0 && (
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic'
                    }}>
                        Add subjects first
                    </p>
                )}
            </div>
        </div>
    );
}
