import { useMemo, useState } from 'react';
import { evaluateStreaksAndBadges } from '../../utils/analytics';

function Confetti({ active }) {
    if (!active) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
            {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    width: '8px',
                    height: '8px',
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    background: ['#ff6600', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444'][Math.floor(Math.random() * 6)],
                    animation: `confetti-fall ${1.5 + Math.random()}s ease-in ${Math.random() * 0.5}s forwards`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                }} />
            ))}
        </div>
    );
}

export default function StreakDisplay({ transactions, budget }) {
    const [showBadges, setShowBadges] = useState(false);
    const [confettiActive, setConfettiActive] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [seenBadges] = useState(() => {
        try { return new Set(JSON.parse(sessionStorage.getItem('seen_badges') || '[]')); }
        catch { return new Set(); }
    });

    const result = useMemo(() => {
        if (!transactions) return null;
        const r = evaluateStreaksAndBadges(transactions, budget);

        // Check for new badges
        const newBadges = r.allBadges.filter(b => b.earned && !seenBadges.has(b.id));
        if (newBadges.length > 0) {
            const badge = newBadges[0];
            setTimeout(() => {
                setConfettiActive(true);
                setToastMsg(`${badge.emoji} New badge: ${badge.name}!`);
                setTimeout(() => { setConfettiActive(false); setToastMsg(null); }, 3500);
                const updated = [...seenBadges, ...newBadges.map(b => b.id)];
                sessionStorage.setItem('seen_badges', JSON.stringify(updated));
                newBadges.forEach(b => seenBadges.add(b.id));
            }, 800);
        }

        return r;
    }, [transactions, budget]);

    if (!result) return null;

    const { currentStreaks, allBadges, underBudgetStreak } = result;
    const earnedBadges = allBadges.filter(b => b.earned);
    const lockedBadges = allBadges.filter(b => !b.earned);

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    };

    return (
        <>
            <style>{`
                @keyframes confetti-fall {
                    from { transform: translateY(0) rotate(0deg); opacity: 1; }
                    to { transform: translateY(105vh) rotate(720deg); opacity: 0; }
                }
            `}</style>

            <Confetti active={confettiActive} />

            {/* Toast */}
            {toastMsg && (
                <div style={{
                    position: 'fixed', top: '5rem', right: '1rem', zIndex: 9999,
                    background: 'linear-gradient(135deg, var(--primary), #cc4400)',
                    color: '#fff', borderRadius: '0.75rem', padding: '0.75rem 1.25rem',
                    fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 8px 24px rgba(255,102,0,0.4)',
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    🎉 {toastMsg}
                </div>
            )}

            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Streaks & Badges</h3>
                    <button
                        onClick={() => setShowBadges(!showBadges)}
                        aria-label={showBadges ? 'Show streaks' : 'Show badges'}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.3rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {showBadges ? '🔥 Streaks' : `🏆 Badges (${earnedBadges.length}/${allBadges.length})`}
                    </button>
                </div>

                {!showBadges ? (
                    <>
                        {/* Active Streaks */}
                        {currentStreaks.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {currentStreaks.map(s => (
                                    <div key={s.type} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.6rem 0.875rem', borderRadius: '0.625rem',
                                        background: `${s.color}15`, border: `1px solid ${s.color}30`,
                                    }}>
                                        <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                                                {s.days}-day {s.label} streak
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                {s.type === 'underBudget' && "Don't break it today! 💪"}
                                                {s.type === 'noImpulse' && 'No late-night impulse buys 🛑'}
                                                {s.type === 'logging' && 'Keep logging daily 📝'}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: s.color, color: '#fff', borderRadius: '0.375rem',
                                            padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 900, minWidth: '2rem', textAlign: 'center',
                                        }}>
                                            {s.days}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '1rem 0' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🌟</div>
                                Start a streak by staying under budget today!
                            </div>
                        )}

                        {/* Streak break notice */}
                        {underBudgetStreak === 0 && transactions.length > 0 && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', color: '#f59e0b' }}>
                                ✨ Start a new streak today — every day under budget counts!
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Earned badges */}
                        {earnedBadges.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Earned</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem' }}>
                                    {earnedBadges.map(b => (
                                        <div key={b.id} title={b.desc} style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                            padding: '0.625rem', borderRadius: '0.625rem',
                                            background: 'rgba(255,102,0,0.1)', border: '1px solid rgba(255,102,0,0.25)',
                                        }}>
                                            <span style={{ fontSize: '1.4rem' }}>{b.emoji}</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>{b.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Locked badges */}
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Locked</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem' }}>
                                {lockedBadges.map(b => (
                                    <div key={b.id} title={b.desc} style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                        padding: '0.625rem', borderRadius: '0.625rem',
                                        background: 'var(--input-bg)', border: '1px solid var(--border)',
                                        opacity: 0.5,
                                    }}>
                                        <span style={{ fontSize: '1.4rem', filter: 'grayscale(1)' }}>{b.emoji}</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{b.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
