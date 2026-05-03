import { useMemo } from 'react';
import { useHistoricalAnalyticsContext } from '../../hooks/useHistoricalAnalytics.jsx';
import { analyzeSpendingPersonality } from '../../utils/analytics';

const CONFIDENCE_BADGE = {
    low:      { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', text: 'LOW CONFIDENCE' },
    moderate: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', text: 'MODERATE' },
};

export default function PersonalityScoreCard({ budget }) {
    const { lastMonth, twoMonthsAgo, thisMonth, lastMonthName, isLoading } = useHistoricalAnalyticsContext();

    const result = useMemo(() => {
        if (isLoading) return null;
        return analyzeSpendingPersonality(lastMonth, twoMonthsAgo, budget, thisMonth);
    }, [lastMonth, twoMonthsAgo, budget, thisMonth, isLoading]);

    if (isLoading) {
        return (
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                    Analyzing spending personality…
                </div>
            </div>
        );
    }

    if (!result) return null;

    const badge = CONFIDENCE_BADGE[result.confidenceLevel];

    return (
        <div style={cardStyle} aria-label={`Spending personality: ${result.archetype}`}>
            {/* Decorative circle */}
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,102,0,0.15), transparent 70%)', pointerEvents: 'none' }} />

            {/* ── Top row: emoji + archetype + badge ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ fontSize: '3rem', lineHeight: 1, flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(255,102,0,0.4))' }}>
                    {result.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <div style={{
                            fontSize: '1.1rem', fontWeight: 900,
                            background: 'linear-gradient(135deg, var(--primary), #ff8533)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            {result.archetype}
                        </div>
                        {badge && (
                            <span style={{
                                padding: '0.1rem 0.45rem', borderRadius: '0.3rem',
                                background: badge.bg, color: badge.color,
                                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
                            }}>
                                {badge.text}
                            </span>
                        )}
                    </div>

                    {/* Confidence bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1, height: '5px', background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', width: `${result.confidence}%`,
                                background: 'linear-gradient(to right, var(--primary), #ff8533)',
                                borderRadius: 9999, transition: 'width 1s ease',
                            }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {result.confidence}% match
                        </span>
                    </div>

                    {/* Traits */}
                    <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {result.traits.map((trait, i) => (
                            <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                <span style={{ color: 'var(--primary)', flexShrink: 0 }}>›</span>
                                {trait}
                            </li>
                        ))}
                    </ul>

                    {/* Improvement tip */}
                    <div style={{
                        background: 'rgba(255,102,0,0.08)', borderRadius: '0.5rem',
                        padding: '0.6rem 0.75rem', fontSize: '0.75rem',
                        color: 'var(--text-secondary)', borderLeft: '3px solid var(--primary)', lineHeight: 1.5,
                    }}>
                        💡 <strong>How to improve:</strong> {result.improvement}
                    </div>
                </div>
            </div>

            {/* ── Personality Drift notification ── */}
            {result.drift && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 0.875rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    fontSize: '0.78rem',
                    lineHeight: 1.5,
                    color: 'var(--text)',
                }}>
                    <span style={{ fontWeight: 700, color: '#8b5cf6' }}>📈 Personality Shift Detected</span>
                    <br />
                    Your spending style shifted from{' '}
                    <strong>{result.drift.fromEmoji} {result.drift.from}</strong>
                    {' → '}
                    <strong>{result.drift.toEmoji} {result.drift.to}</strong> last month.
                    {result.drift.detail && (
                        <span style={{ color: 'var(--text-secondary)' }}> Here's what changed: {result.drift.detail}</span>
                    )}
                </div>
            )}

            {/* ── This Month vs Baseline comparison ── */}
            {result.categoryComparison && result.categoryComparison.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{
                        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.5rem',
                    }}>
                        This Month vs {lastMonthName} (Baseline)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {result.categoryComparison.slice(0, 5).map(item => {
                            const isUp = item.pctChange > 20;
                            const isDown = item.pctChange < -20;
                            const isNeutral = !isUp && !isDown;
                            const statusIcon = isUp && item.pctChange > 100 ? '🚨'
                                : isUp ? '⬆️'
                                : isDown ? '✅'
                                : '➡️';
                            const statusColor = isUp && item.pctChange > 100 ? '#ef4444'
                                : isUp ? '#f59e0b'
                                : isDown ? '#10b981'
                                : 'var(--text-secondary)';
                            return (
                                <div
                                    key={item.category}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.35rem 0.5rem', borderRadius: '0.4rem',
                                        background: isUp && item.pctChange > 100
                                            ? 'rgba(239,68,68,0.06)'
                                            : isUp ? 'rgba(245,158,11,0.06)'
                                            : isDown ? 'rgba(16,185,129,0.06)'
                                            : 'transparent',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <span style={{ flexShrink: 0 }}>{statusIcon}</span>
                                    <span style={{ flex: 1, fontWeight: 600, color: 'var(--text)' }}>{item.category}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        ₹{item.thisMonth.toLocaleString('en-IN')} this mo
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>vs</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        ₹{item.lastMonth.toLocaleString('en-IN')} last mo
                                    </span>
                                    <span style={{ color: statusColor, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        ({item.pctChange > 0 ? '+' : ''}{item.pctChange}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '0.875rem', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                🔄 {result.confidenceLabel}
            </div>
        </div>
    );
}

const cardStyle = {
    backgroundColor: 'var(--surface)',
    backgroundImage: 'linear-gradient(135deg, rgba(255,102,0,0.07), transparent 60%)',
    borderRadius: '1rem',
    border: '1px solid var(--border)',
    padding: '1.25rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(12px)',
    position: 'relative',
    overflow: 'hidden',
};
