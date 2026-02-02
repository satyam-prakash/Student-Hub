import React, { useEffect, useState } from 'react';

export default function ResultsSection({ results, onReset, inputs }) {
    if (!results) return null;

    const { subjectWise, overall, weekWise } = results;
    const [animate, setAnimate] = useState(false);
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const [targetPercentage, setTargetPercentage] = useState(75);

    useEffect(() => {
        setAnimate(false);
        const timer = setTimeout(() => setAnimate(true), 100);

        let startTimestamp = null;
        const duration = 1000;
        const targetValue = parseFloat(overall.percentage);

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setDisplayPercentage((targetValue * easeProgress).toFixed(2));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);

        return () => clearTimeout(timer);
    }, [results, overall.percentage]);

    const getColor = (pct) => {
        if (pct >= 75) return 'var(--success)';
        if (pct >= 60) return 'var(--warning)';
        return 'var(--error)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Combined Hero Card */}
            <div className="card" style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '1.5rem', background: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)', opacity: 0.8 }}></div>
                <div style={{ position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '100px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.15 }}></div>

                {/* Overall Stats Section */}
                <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Projected Overall Attendance
                    <span style={{ fontSize: '1rem', color: 'var(--warning)' }}>⚠</span>
                </h2>
                <div style={{ fontSize: 'clamp(3rem, 12vw, 4rem)', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem', transition: 'color 0.5s', color: getColor(overall.percentage), textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    {displayPercentage}%
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', marginBottom: '1.5rem' }}>
                    <span style={{ color: 'var(--text)', fontWeight: '600' }}>{overall.attended + overall.dutyLeave}</span> / {overall.total} Classes <span style={{ opacity: 0.7 }}>(Attended + Duty Leave)</span>
                </p>

                {/* Separator */}
                {/* Separator */}
                <div style={{ margin: '0 auto 1.5rem auto', width: '80%', height: '1px', background: 'linear-gradient(to right, transparent, var(--border), transparent)' }}></div>

                {/* Target & Slider Section */}
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h3 style={{ fontSize: 'clamp(0.9rem, 4vw, 1rem)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text)' }}>
                        Target Attendance: <span style={{ color: 'var(--primary)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{targetPercentage}%</span>
                    </h3>

                    <div style={{ position: 'relative', height: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={targetPercentage}
                            onChange={(e) => setTargetPercentage(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                cursor: 'pointer',
                                height: '4px',
                                background: `linear-gradient(to right, var(--primary) ${targetPercentage}%, var(--border) ${targetPercentage}%)`,
                                borderRadius: '3px',
                                outline: 'none'
                            }}
                            className="attendance-slider"
                        />
                    </div>

                    {/* Insights Section */}
                    {(() => {
                        // Global Bunk/Requirement Calculation
                        // We need current ATTENDED (past) and current TOTAL (past) to determine "Remaining".
                        // 'inputs' prop has the initial state before projection.

                        const content = (() => {
                            // Calculate totals from Inputs (Past/Current status)
                            const currentInputStats = inputs ? inputs.reduce((acc, sub) => ({
                                attended: acc.attended + (parseInt(sub.attended) || 0) + (parseInt(sub.dutyLeave) || 0), // Include DL in what we ALREADY have
                                total: acc.total + (parseInt(sub.total) || 0)
                            }), { attended: 0, total: 0 }) : { attended: 0, total: 0 };

                            // Projected (Max Possible)
                            const maxPossibleAttended = overall.attended + overall.dutyLeave;
                            const totalSemesterClasses = overall.total;

                            // Remaining Future Classes
                            // If projected total > current input total, the diff is future classes.
                            // Wait, calculateAttendanceADDS future classes to totals.
                            const futureClasses = totalSemesterClasses - currentInputStats.total;

                            // Target Requirements
                            const requiredAttended = Math.ceil((targetPercentage / 100) * totalSemesterClasses);

                            // Scenario 1: Shortage even with 100% future attendance
                            if (maxPossibleAttended < requiredAttended) {
                                const shortBy = requiredAttended - maxPossibleAttended;
                                return (
                                    <div style={{ textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--error)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', marginBottom: '0.5rem' }}>
                                            <span>⚠</span>
                                            <span>
                                                Impossible to reach <strong style={{ color: 'var(--text)' }}>{targetPercentage}%</strong>.
                                            </span>
                                        </p>
                                        <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--error)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
                                            <span>✖</span>
                                            <span>
                                                Even with 100% attendance, you will be short by <strong style={{ color: 'var(--text)' }}>{shortBy}</strong> classes. Max possible: <strong style={{ color: 'var(--text)' }}>{((maxPossibleAttended / totalSemesterClasses) * 100).toFixed(2)}%</strong>
                                            </span>
                                        </p>
                                    </div>
                                );
                            }

                            // Scenario 2: Reachable (Need to attend X of Y remaining)
                            // Or Scenario 3: Bunkable (Can miss X)

                            // Calculate "Must Attend" from Future
                            // We have 'currentInputStats.attended'. Need 'requiredAttended'.
                            const mustAttendTotal = requiredAttended - currentInputStats.attended;
                            // Actually, 'mustAttendTotal' might be negative if we ALREADY have enough?
                            // If mustAttendTotal <= 0, we already met the target count!

                            if (mustAttendTotal <= 0) {
                                // Already achieved target
                                const surplus = currentInputStats.attended - requiredAttended;
                                const canMiss = futureClasses + surplus; // technically you can miss ALL future classes + surplus?
                                // No, you can only miss future classes.
                                const canMissFinal = Math.min(canMiss, futureClasses);

                                return (
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--success)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', marginBottom: '0.5rem' }}>
                                            <span>✓</span>
                                            <span>
                                                You have already reached <strong style={{ color: 'var(--text)' }}>{targetPercentage}%</strong> requirement!
                                            </span>
                                        </p>
                                        <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--warning)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
                                            <span>✓</span>
                                            <span>You can miss up to <strong style={{ color: 'var(--text)' }}>{canMissFinal}</strong> classes.</span>
                                        </p>
                                    </div>
                                );
                            }

                            // Normal Case: Need to attend some future classes
                            // futureClasses is available.
                            // mustAttendTotal is needed from future.

                            const canMiss = futureClasses - mustAttendTotal;

                            return (
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--success)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', marginBottom: '0.5rem' }}>
                                        <span>✓</span>
                                        <span>
                                            You need to attend <strong style={{ color: 'var(--text)' }}>{Math.max(0, mustAttendTotal)}</strong> of the remaining <strong style={{ color: 'var(--text)' }}>{futureClasses}</strong> classes to reach <strong style={{ color: 'var(--text)' }}>{targetPercentage}%</strong>.
                                        </span>
                                    </p>
                                    {canMiss > 0 ? (
                                        <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--warning)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
                                            <span>✓</span>
                                            <span>You can miss up to <strong style={{ color: 'var(--text)' }}>{canMiss}</strong> classes</span>
                                        </p>
                                    ) : (
                                        <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--error)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
                                            <span>⚠</span>
                                            <span>You cannot miss any more classes!</span>
                                        </p>
                                    )}
                                </div>
                            );
                        })();

                        return (
                            <div style={{ minHeight: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {content}
                            </div>
                        );
                    })()}
                </div>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text)' }}>Subject Wise Projection</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {subjectWise.map(sub => {
                        // Calculate bunk logic
                        // Max possible attendance (Projected Attended)
                        const maxAttended = sub.attended + (sub.dutyLeave || 0); // Note: sub.attended from calculator ALREADY includes projected classes as attended.
                        // Wait, verify calculator logic.
                        // currentStats[subName].attended += count; <- Yes, projected sets it to attended.

                        const projectedTotal = sub.total;

                        // Inputs (Actual current status)
                        const inputSub = inputs ? inputs.find(i => i.name === sub.name) : null;
                        const currentTotal = inputSub ? parseInt(inputSub.total) || 0 : 0;
                        const futureClasses = projectedTotal - currentTotal;

                        // Required attendance to meet target
                        const target = targetPercentage;
                        const requiredAttended = Math.ceil((target / 100) * projectedTotal);

                        // Bunks calculation
                        // We have maxAttended (Best case).
                        // How many can we drop and still meet requiredAttended?
                        // Bunkable = maxAttended - requiredAttended.

                        let bunkable = maxAttended - requiredAttended;

                        // Cap/Limit logic
                        // You can only bunk FUTURE classes.
                        // Can't bunk classes that already happened.
                        const finalBunks = Math.min(bunkable, futureClasses);

                        const canBunk = finalBunks > 0;
                        const isShort = finalBunks < 0; // Means even with 100% future attendance, you fail target?
                        // If Bunkable < 0, it means MaxAttended < RequiredAttended. Impossible to reach target.

                        return (
                            <div key={sub.name} style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', transition: 'background 0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={sub.name}>{sub.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)', fontWeight: '500' }}>({maxAttended}/{projectedTotal})</span>
                                        <span style={{ fontWeight: 'bold', color: getColor(sub.percentage) }}>{sub.percentage}%</span>
                                    </div>
                                </div>
                                <div style={{ height: '0.5rem', background: 'var(--input-bg)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: '9999px',
                                            transition: 'width 1s ease-out',
                                            width: animate ? `${sub.percentage}%` : '0%',
                                            backgroundColor: getColor(sub.percentage)
                                        }}
                                    />
                                </div>
                                <div style={{ height: '0.25rem', background: 'var(--input-bg)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.5rem', opacity: 0.7 }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: '9999px',
                                            width: `${targetPercentage}%`,
                                            backgroundColor: 'var(--primary)'
                                        }}
                                    />
                                </div>

                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.875rem' }}>
                                    {canBunk ? (
                                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                            Can bunk {finalBunks} more classes
                                        </span>
                                    ) : (
                                        bunkable < 0 ? (
                                            <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>
                                                Cannot reach {target}% (Short by {-bunkable})
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
                    })}
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text)' }}>Week-wise Breakdown</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>Week Ending</th>
                                <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Overall</th>
                                {subjectWise.map(s => (
                                    <th key={s.name} style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>{s.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {weekWise.map((week, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{week.date}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        <span style={{ color: getColor(week.overall.percentage) }}>{week.overall.percentage}%</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                                            ({week.overall.attended + week.overall.dutyLeave}/{week.overall.total})
                                        </span>
                                    </td>
                                    {subjectWise.map(sub => {
                                        const stats = week.stats[sub.name];
                                        const pct = stats.total === 0 ? 0 : (((stats.attended + stats.dutyLeave) / stats.total) * 100).toFixed(1);
                                        return (
                                            <td key={sub.name} style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                                <span style={{ color: getColor(pct) }}>{pct}%</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                                                    ({stats.attended + stats.dutyLeave}/{stats.total})
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <button
                onClick={onReset}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
            >
                Edit Inputs
            </button>
        </div>
    );
}
