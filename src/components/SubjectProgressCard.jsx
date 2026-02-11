export default function SubjectProgressCard({
    subject,
    targetPercentage,
    inputs,
    animate,
    getColor
}) {
    // Calculate bunk logic
    const maxAttended = subject.attended + (subject.dutyLeave || 0);
    const projectedTotal = subject.total;

    // Inputs (Actual current status)
    const inputSub = inputs ? inputs.find(i => i.name === subject.name) : null;
    const currentTotal = inputSub ? parseInt(inputSub.total) || 0 : 0;
    const futureClasses = projectedTotal - currentTotal;

    // Required attendance to meet target
    const requiredAttended = Math.ceil((targetPercentage / 100) * projectedTotal);

    // Bunks calculation
    let bunkable = maxAttended - requiredAttended;
    const finalBunks = Math.min(bunkable, futureClasses);

    const canBunk = finalBunks > 0;

    return (
        <div style={{
            padding: '1.25rem',
            borderRadius: '0.75rem',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            transition: 'background 0.3s'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
            }}>
                <span style={{
                    fontWeight: 'bold',
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px'
                }} title={subject.name}>
                    {subject.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        ({maxAttended}/{projectedTotal})
                    </span>
                    <span style={{ fontWeight: 'bold', color: getColor(subject.percentage) }}>
                        {subject.percentage}%
                    </span>
                </div>
            </div>

            {/* Main Progress Bar */}
            <div style={{
                height: '0.5rem',
                background: 'var(--input-bg)',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginBottom: '0.25rem'
            }}>
                <div style={{
                    height: '100%',
                    borderRadius: '9999px',
                    transition: 'width 1s ease-out',
                    width: animate ? `${subject.percentage}%` : '0%',
                    backgroundColor: getColor(subject.percentage)
                }} />
            </div>

            {/* Target Indicator */}
            <div style={{
                height: '0.25rem',
                background: 'var(--input-bg)',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginBottom: '0.5rem',
                opacity: 0.7
            }}>
                <div style={{
                    height: '100%',
                    borderRadius: '9999px',
                    width: `${targetPercentage}%`,
                    backgroundColor: 'var(--primary)'
                }} />
            </div>

            {/* Bunk Status */}
            <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                fontSize: '0.875rem'
            }}>
                {canBunk ? (
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                        Can bunk {finalBunks} more classes
                    </span>
                ) : (
                    bunkable < 0 ? (
                        <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>
                            Cannot reach {targetPercentage}% (Short by {-bunkable})
                        </span>
                    ) : (
                        <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>
                            Cannot bunk any classes
                        </span>
                    )
                )}
            </div>
        </div>
    );
}
