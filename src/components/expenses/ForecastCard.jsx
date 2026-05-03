import { useMemo, useState } from 'react';
import { calculateForecast } from '../../utils/analytics';
import { useHistoricalAnalyticsContext } from '../../hooks/useHistoricalAnalytics.jsx';

function ArcProgress({ pct, color }) {
    const r = 42;
    const circumference = Math.PI * r;
    const arcLen = circumference * Math.min(pct / 100, 1);
    const gap = circumference - arcLen;

    return (
        <svg width="112" height="64" viewBox="0 0 112 64" aria-hidden="true">
            <path d={`M 14 56 A ${r} ${r} 0 0 1 98 56`} fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
            <path d={`M 14 56 A ${r} ${r} 0 0 1 98 56`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${arcLen} ${gap}`}
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
    );
}

export default function ForecastCard({ transactions, budget, selectedMonthStr }) {
    const { lastMonth, lastMonthName, lastMonthTotal } = useHistoricalAnalyticsContext();

    const todayForForecast = useMemo(() => {
        if (!selectedMonthStr) return new Date();
        const [y, m] = selectedMonthStr.split('-').map(Number);
        const realNow = new Date();
        if (y === realNow.getFullYear() && (m - 1) === realNow.getMonth()) return realNow;
        return new Date(y, m, 0, 23, 59, 59);
    }, [selectedMonthStr]);

    const isHistorical = todayForForecast.getMonth() !== new Date().getMonth()
        || todayForForecast.getFullYear() !== new Date().getFullYear();

    const [simDelta, setSimDelta] = useState(0);

    // Use only current-month transactions for forecast
    const currentMonthTxns = useMemo(() => {
        const start = new Date(todayForForecast.getFullYear(), todayForForecast.getMonth(), 1);
        return (transactions || []).filter(t => {
            const d = new Date(t.date || t.created_at);
            return d >= start && d <= todayForForecast;
        });
    }, [transactions, todayForForecast]);

    const forecast = useMemo(
        () => calculateForecast(currentMonthTxns, budget, todayForForecast, lastMonth),
        [currentMonthTxns, budget, todayForForecast, lastMonth]
    );

    if (!forecast || forecast.status === 'no-data') {
        return (
            <div style={cardStyle}>
                <div style={labelStyle}>Month Forecast</div>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem 0' }}>
                    📅 Come back on Day 2 for your first forecast
                </div>
            </div>
        );
    }

    const { projectedMonthEnd, totalSpentThisMonth, confidence, daysElapsed, daysInMonth, daysRemaining,
        projectedOverrun, dailyCutRequired, status, topCategory, topCategoryDailySpend, isCalibrated } = forecast;

    const color = status === 'danger' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';
    const pct = budget > 0 ? Math.min((projectedMonthEnd / budget) * 100, 130) : 0;

    // Simulation
    const daysLeft = daysRemaining ?? (daysInMonth - daysElapsed);
    const simSaving = simDelta * daysLeft;
    const simProjected = Math.max(projectedMonthEnd - simSaving, totalSpentThisMonth);
    const simStatus = simProjected > budget * 1.1 ? 'danger' : simProjected > budget * 0.9 ? 'warning' : 'safe';
    const simColor = simStatus === 'danger' ? '#ef4444' : simStatus === 'warning' ? '#f59e0b' : '#10b981';
    const simPct = budget > 0 ? Math.min((simProjected / budget) * 100, 130) : 0;

    const displayProjected = simDelta > 0 ? simProjected : projectedMonthEnd;
    const displayColor = simDelta > 0 ? simColor : color;
    const displayPct = simDelta > 0 ? simPct : pct;

    // MoM strip data
    const hasLastMonth = lastMonthTotal > 0;
    const momChange = hasLastMonth ? Math.round(((projectedMonthEnd - lastMonthTotal) / lastMonthTotal) * 100) : null;

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                <div style={labelStyle}>Month Forecast</div>
                {isCalibrated && (
                    <span style={{
                        fontSize: '0.58rem', padding: '0.1rem 0.4rem', borderRadius: '0.3rem',
                        background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700,
                    }}>
                        ⚡ Calibrated
                    </span>
                )}
            </div>

            {/* Arc */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.1rem', position: 'relative' }}>
                <ArcProgress pct={displayPct} color={displayColor} />
                <div style={{ marginTop: '-0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: displayColor }}>
                        ₹{displayProjected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                        {isHistorical ? 'total spend' : 'projected this month'}
                    </div>
                </div>
            </div>

            {/* Status message */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4, marginTop: '0.25rem' }}>
                {status === 'safe' && <span style={{ color: '#10b981' }}>✅ On track! ₹{Math.abs(projectedOverrun).toLocaleString('en-IN', { maximumFractionDigits: 0 })} under budget</span>}
                {status === 'warning' && <span style={{ color: '#f59e0b' }}>⚠️ Close to limit — ₹{dailyCutRequired.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day over pace</span>}
                {status === 'danger' && <span style={{ color: '#ef4444' }}>🚨 Cut ₹{dailyCutRequired.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day to stay on track</span>}
            </div>

            {/* Confidence */}
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.2rem' }}>
                {isHistorical
                    ? 'Actual spend for month'
                    : `Based on ${daysElapsed}d of data · ${confidence < 50 ? 'Low' : confidence < 80 ? 'Moderate' : 'High'} confidence`}
            </div>

            {/* ── "How to get back on track" ── */}
            {!isHistorical && status === 'danger' && topCategory && daysLeft > 0 && (
                <div style={{
                    marginTop: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.6rem',
                    background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: '0.72rem',
                    lineHeight: 1.5,
                    color: 'var(--text)',
                }}>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>💡 Back on track:</span>
                    {' '}Cut ₹{dailyCutRequired.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day.
                    Your <strong>{topCategory}</strong> spend (₹{topCategoryDailySpend.toLocaleString('en-IN')}/day)
                    is your biggest lever — reducing it by 40% gets you there.
                </div>
            )}

            {/* ── Month-over-Month comparison strip ── */}
            {!isHistorical && hasLastMonth && momChange !== null && (
                <div style={{
                    marginTop: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '0.375rem',
                    alignItems: 'center',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '0.6rem',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    fontSize: '0.65rem',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>Last month</div>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>₹{lastMonthTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div style={{ color: 'var(--border)', fontSize: '0.7rem' }}>│</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>This mo projected</div>
                        <div style={{ fontWeight: 700, color: momChange > 15 ? '#ef4444' : momChange < -15 ? '#10b981' : 'var(--text)' }}>
                            {momChange > 0 ? '+' : ''}{momChange}% {momChange > 15 ? '⚠️' : momChange < -15 ? '✅' : ''}
                        </div>
                    </div>
                </div>
            )}

            {/* What-if slider */}
            {budget > 0 && daysLeft > 0 && !isHistorical && (
                <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.3rem' }}>
                        What if I spend <strong style={{ color: simDelta > 0 ? simColor : 'var(--text)' }}>₹{simDelta}/day less</strong>?
                        {simDelta > 0 && <span style={{ color: simColor }}> → Save ₹{simSaving.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>}
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={Math.round(dailyCutRequired * 2) || 500}
                        value={simDelta}
                        onChange={e => setSimDelta(Number(e.target.value))}
                        aria-label="Simulate daily spending reduction"
                        className="attendance-slider"
                        style={{
                            width: '100%', accentColor: 'var(--primary)',
                            background: `linear-gradient(to right, var(--primary) ${simDelta / (Math.round(dailyCutRequired * 2) || 500) * 100}%, var(--border) 0%)`,
                            height: '4px', borderRadius: '3px', border: 'none', padding: 0,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

const cardStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.875rem',
    padding: '0.875rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
};

const labelStyle = {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--text-secondary)',
};
