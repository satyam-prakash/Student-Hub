import React, { useState } from 'react';
import SubjectProgressCard from './SubjectProgressCard';
import { useProgressAnimation, useCardAnimation } from '../hooks/useProgressAnimation';

export default function ResultsSection({ results, onReset, inputs }) {
    if (!results) return null;

    const { subjectWise, overall, weekWise } = results;
    const [targetPercentage, setTargetPercentage] = useState(75);
    const displayPercentage = useProgressAnimation(parseFloat(overall.percentage));
    const animate = useCardAnimation();

    const getColor = (pct) => {
        if (pct >= 75) return 'var(--success)';
        if (pct >= 60) return 'var(--warning)';
        return 'var(--error)';
    };

    // Calculate insights content
    const getInsightsContent = () => {
        const currentInputStats = inputs ? inputs.reduce((acc, sub) => ({
            attended: acc.attended + (parseInt(sub.attended) || 0) + (parseInt(sub.dutyLeave) || 0),
            total: acc.total + (parseInt(sub.total) || 0)
        }), { attended: 0, total: 0 }) : { attended: 0, total: 0 };

        const maxPossibleAttended = overall.attended + overall.dutyLeave;
        const totalSemesterClasses = overall.total;
        const futureClasses = totalSemesterClasses - currentInputStats.total;
        const requiredAttended = Math.ceil((targetPercentage / 100) * totalSemesterClasses);

        // Scenario 1: Impossible to reach target
        if (maxPossibleAttended < requiredAttended) {
            const shortBy = requiredAttended - maxPossibleAttended;
            return (
                <div style={{ textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--error)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', marginBottom: '0.5rem' }}>
                        <span>⚠</span>
                        <span>Impossible to reach <strong style={{ color: 'var(--text)' }}>{targetPercentage}%</strong>.</span>
                    </p>
                    <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--error)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
                        <span>✖</span>
                        <span>Even with 100% attendance, you will be short by <strong style={{ color: 'var(--text)' }}>{shortBy}</strong> classes. Max possible: <strong style={{ color: 'var(--text)' }}>{((maxPossibleAttended / totalSemesterClasses) * 100).toFixed(2)}%</strong></span>
                    </p>
                </div>
            );
        }

        const mustAttendTotal = requiredAttended - currentInputStats.attended;

        // Scenario 2: Already achieved target
        if (mustAttendTotal <= 0) {
            const canMissFinal = Math.min(futureClasses, futureClasses + mustAttendTotal);
            return (
                <div style={{ textAlign: 'left' }}>
                    <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--success)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', marginBottom: '0.5rem' }}>
                        <span>✓</span>
                        <span>You have already reached <strong style={{ color: 'var(--text)' }}>{targetPercentage}%</strong> requirement!</span>
                    </p>
                    <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--warning)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
                        <span>✓</span>
                        <span>You can miss up to <strong style={{ color: 'var(--text)' }}>{canMissFinal}</strong> classes.</span>
                    </p>
                </div>
            );
        }

        // Scenario 3: Normal case
        const canMiss = futureClasses - mustAttendTotal;
        return (
            <div style={{ textAlign: 'left' }}>
                <p style={{ display: 'flex', gap: '0.75rem', color: 'var(--success)', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', marginBottom: '0.5rem' }}>
                    <span>✓</span>
                    <span>You need to attend <strong style={{ color: 'var(--text)' }}>{Math.max(0, mustAttendTotal)}</strong> of the remaining <strong style={{ color: 'var(--text)' }}>{futureClasses}</strong> classes to reach <strong style={{ color: 'var(--text)' }}>{targetPercentage}%</strong>.</span>
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
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Hero Card */}
            <div className="card" style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '1.5rem', background: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)', opacity: 0.8 }}></div>
                <div style={{ position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '100px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.15 }}></div>

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

                <div style={{ margin: '0 auto 1.5rem auto', width: '80%', height: '1px', background: 'linear-gradient(to right, transparent, var(--border), transparent)' }}></div>

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

                    <div style={{ minHeight: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {getInsightsContent()}
                    </div>
                </div>
            </div>

            {/* Subject Wise Projection */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text)' }}>Subject Wise Projection</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {subjectWise.map(sub => (
                        <SubjectProgressCard
                            key={sub.name}
                            subject={sub}
                            targetPercentage={targetPercentage}
                            inputs={inputs}
                            animate={animate}
                            getColor={getColor}
                        />
                    ))}
                </div>
            </div>

            {/* Week-wise Breakdown */}
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
