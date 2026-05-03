import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const SEVERITY_CONFIG = {
    critical: {
        borderColor: '#ef4444',
        background: 'rgba(239,68,68,0.07)',
        headerBg: 'rgba(239,68,68,0.12)',
        icon: '🚨',
        label: 'Critical spike',
    },
    warning: {
        borderColor: '#f59e0b',
        background: 'rgba(245,158,11,0.07)',
        headerBg: 'rgba(245,158,11,0.12)',
        icon: '⚠️',
        label: 'Elevated spend',
    },
};

const ROOT_CAUSE_ICONS = {
    single_large_transaction: '📍',
    frequency_spike: '🔁',
    amount_per_txn_spike: '💸',
    new_category_activity: '🆕',
    general_increase: '📊',
};

function AnomalyCard({ anomaly, onFilterToCategory }) {
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const cfg = SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.warning;
    const rootIcon = ROOT_CAUSE_ICONS[anomaly.rootCause] || '📊';
    const baseline = anomaly.baseline || anomaly.rollingAvg || 0;

    return (
        <div
            role="alert"
            aria-label={`${cfg.label} for ${anomaly.category}`}
            style={{
                borderRadius: '0.875rem',
                border: `1px solid ${cfg.borderColor}40`,
                borderLeft: `4px solid ${cfg.borderColor}`,
                background: cfg.background,
                backdropFilter: 'blur(8px)',
                overflow: 'hidden',
                animation: 'fadeInUp 0.3s ease',
                transition: 'all 0.2s ease',
            }}
        >
            {/* ── Collapsed Header (always visible) ── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onClick={() => setExpanded(v => !v)}
                role="button"
                aria-expanded={expanded}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
            >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cfg.icon}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 700 }}>
                        {anomaly.category} up {anomaly.percentageIncrease}%
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                        — ₹{anomaly.currentWeekSpend.toLocaleString('en-IN')} vs your usual ₹{baseline.toLocaleString('en-IN')}
                    </span>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                    aria-label={expanded ? 'Collapse details' : 'Expand details'}
                    style={{
                        background: `${cfg.borderColor}15`,
                        border: `1px solid ${cfg.borderColor}40`,
                        color: cfg.borderColor,
                        borderRadius: '0.4rem',
                        padding: '0.2rem 0.4rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        flexShrink: 0,
                    }}
                >
                    Details {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                <button
                    onClick={e => { e.stopPropagation(); setDismissed(true); }}
                    aria-label="Dismiss alert"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* ── Expanded Details ── */}
            {expanded && (
                <div
                    style={{
                        padding: '0 1rem 0.875rem 2.5rem',
                        borderTop: `1px solid ${cfg.borderColor}20`,
                        animation: 'fadeInUp 0.2s ease',
                    }}
                >
                    {/* Root cause */}
                    {anomaly.rootCauseDetail && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                            marginTop: '0.75rem',
                        }}>
                            <span style={{ fontSize: '0.95rem', flexShrink: 0, lineHeight: 1.4 }}>{rootIcon}</span>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
                                    Root Cause
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5 }}>
                                    {anomaly.rootCauseDetail}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actionable insight */}
                    {anomaly.actionableInsight && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                            marginTop: '0.625rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '0.6rem',
                            background: `${cfg.borderColor}10`,
                            border: `1px solid ${cfg.borderColor}25`,
                        }}>
                            <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>💡</span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5 }}>
                                {anomaly.actionableInsight}
                            </div>
                        </div>
                    )}

                    {/* Savings opportunity + View button */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem',
                    }}>
                        {anomaly.savingsOpportunity > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                fontSize: '0.78rem', color: '#10b981', fontWeight: 700,
                            }}>
                                <span>💰</span>
                                <span>
                                    Potential savings: ₹{anomaly.savingsOpportunity.toLocaleString('en-IN')} recoverable next month
                                </span>
                            </div>
                        )}

                        <button
                            onClick={() => onFilterToCategory && onFilterToCategory(anomaly.category)}
                            aria-label={`View ${anomaly.category} transactions`}
                            style={{
                                background: `${cfg.borderColor}15`,
                                border: `1px solid ${cfg.borderColor}50`,
                                color: cfg.borderColor,
                                borderRadius: '0.5rem',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                marginLeft: 'auto',
                            }}
                        >
                            View transactions →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AnomalyAlertBanner({ anomalies = [], onFilterToCategory }) {
    if (!anomalies || anomalies.length === 0) return null;

    const visible = anomalies.slice(0, 3);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {visible.map((anomaly, i) => (
                <AnomalyCard
                    key={`${anomaly.category}-${anomaly.currentWeekSpend}-${i}`}
                    anomaly={anomaly}
                    onFilterToCategory={onFilterToCategory}
                />
            ))}
        </div>
    );
}
