import { useMemo } from 'react';
import { useHistoricalAnalyticsContext } from '../../hooks/useHistoricalAnalytics.jsx';
import { generateActionPlan } from '../../utils/analytics';

const CARD_COLORS = {
    reduce_category: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', accent: '#ef4444' },
    behavioral:      { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', accent: '#f59e0b' },
    reduce_frequency:{ bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)', accent: '#8b5cf6' },
};

export default function SpendingManagementPanel({ budget, sectionLabel }) {
    const { thisMonth, lastMonth, lastMonthName, thisMonthName, isBaselineReady, confidenceLevel, isLoading } = useHistoricalAnalyticsContext();

    const plan = useMemo(() => {
        if (!thisMonth || !lastMonth) return null;
        return generateActionPlan(thisMonth, lastMonth, budget);
    }, [thisMonth, lastMonth, budget]);

    // Don't render if no budget set, loading, or nothing actionable
    if (!budget || budget <= 0) return null;
    if (isLoading) return null;
    if (!plan || (plan.actions.length === 0 && !plan.isOverspending)) return null;

    const now = new Date();
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    const statusColor = plan.isOverspending ? '#ef4444' : '#10b981';
    const statusBg = plan.isOverspending ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)';

    return (
        <>
        {sectionLabel && sectionLabel('📋 Action Plan')}
        <div
            aria-label="Monthly spending action plan"
            style={{
                borderRadius: '1rem',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,102,0,0.04), transparent 60%)',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                padding: '1rem 1.25rem 0.75rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--input-bg)',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📋</span>
                            <span>YOUR ACTION PLAN</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                — {thisMonthName}
                            </span>
                        </h3>
                        {lastMonth.length > 0 && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                Based on your {lastMonthName} spending patterns
                                {confidenceLevel === 'low' && (
                                    <span style={{
                                        marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '0.3rem',
                                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                                        fontSize: '0.65rem', fontWeight: 700,
                                    }}>LOW CONFIDENCE</span>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status line */}
                <div style={{
                    marginTop: '0.75rem',
                    padding: '0.6rem 0.875rem',
                    borderRadius: '0.6rem',
                    background: statusBg,
                    border: `1px solid ${statusColor}30`,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: statusColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <span>{plan.isOverspending ? '⚠️' : '✅'}</span>
                    <span>
                        {plan.isOverspending
                            ? `On track to overspend by ₹${plan.overspend.toLocaleString('en-IN')} this month`
                            : `On track — projected to stay within budget`
                        }
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        {daysRemaining} days left
                    </span>
                </div>
            </div>

            {/* ── Actions ── */}
            {plan.actions.length > 0 ? (
                <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{
                        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.75rem',
                    }}>
                        TOP {plan.actions.length} ACTIONS
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {plan.actions.map((action, i) => {
                            const colors = CARD_COLORS[action.type] || CARD_COLORS.behavioral;
                            return (
                                <div
                                    key={`${action.type}-${i}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.875rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.75rem',
                                        background: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                        transition: 'transform 0.15s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                                >
                                    {/* Number + Icon */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: colors.accent,
                                            color: '#fff', fontSize: '0.6rem', fontWeight: 900,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {i + 1}
                                        </div>
                                        <span style={{ fontSize: '1rem' }}>{action.icon}</span>
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' }}>
                                            {action.label}
                                            <span style={{
                                                marginLeft: '0.5rem', color: '#10b981',
                                                fontSize: '0.78rem', fontWeight: 600,
                                            }}>
                                                → saves ₹{action.monthlySaving.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            {action.evidence}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Total saving callout */}
                    {plan.totalSavable > 0 && (
                        <div style={{
                            marginTop: '0.875rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
                            border: '1px solid rgba(16,185,129,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>🎯</span>
                            <div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
                                    IF YOU DO ALL {plan.actions.length}: 
                                </span>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text)', marginLeft: '0.35rem' }}>
                                    Projected saving of ₹{plan.totalSavable.toLocaleString('en-IN')} this month
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>✅</div>
                    You're spending in line with last month — no major actions needed.
                </div>
            )}

            {/* No baseline warning */}
            {lastMonth.length === 0 && (
                <div style={{
                    margin: '0 1.25rem 1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                }}>
                    💡 No data from last month yet. Insights will improve as you track more. Showing current month patterns.
                </div>
            )}
        </div>
        </>
    );
}
