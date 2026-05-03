import { Suspense, lazy, useMemo } from 'react';
import { useMediaQuery } from '../../utils/useMediaQuery';
import ForecastCard from './ForecastCard';
import AnomalyAlertBanner from './AnomalyAlertBanner';
import SpendingManagementPanel from './SpendingManagementPanel';
import { detectAnomalies } from '../../utils/analytics';
import { useHistoricalAnalyticsContext } from '../../hooks/useHistoricalAnalytics.jsx';
import CashFlowTimeline from './CashFlowTimeline';

const PersonalityScoreCard = lazy(() => import('./PersonalityScoreCard'));
const SpendingHeatmap       = lazy(() => import('./SpendingHeatmap'));
const CorrelationMatrix     = lazy(() => import('./CorrelationMatrix'));
const StreakDisplay         = lazy(() => import('./StreakDisplay'));
const PeerBenchmarkPanel    = lazy(() => import('./PeerBenchmarkPanel'));

function SkeletonCard({ height = 160, label = '' }) {
    return (
        <div style={{
            backgroundColor: 'var(--surface)', borderRadius: '1rem',
            border: '1px solid var(--border)', height,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', animation: 'pulse 1.5s ease infinite',
        }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            {label && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>}
        </div>
    );
}

export default function AnalyticsTab({ transactions, budget, selectedMonthStr }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { lastMonth, isBaselineReady, isLoading } = useHistoricalAnalyticsContext();

    // Anomalies: use historical baseline if available
    const anomalies = useMemo(
        () => detectAnomalies(transactions, lastMonth),
        [transactions, lastMonth]
    );

    const sectionLabel = (text) => (
        <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-secondary)', marginTop: '0.25rem',
        }}>
            {text}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>

            {/* Page header */}
            <div>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800 }}>Analytics</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Deep insights into your spending behaviour
                    {isBaselineReady && (
                        <span style={{
                            marginLeft: '0.5rem', padding: '0.1rem 0.45rem',
                            borderRadius: '0.3rem', background: 'rgba(16,185,129,0.12)',
                            color: '#10b981', fontSize: '0.65rem', fontWeight: 700,
                        }}>
                            ✓ Historical baseline active
                        </span>
                    )}
                </p>
            </div>

            {/* ══ Action Plan (NEW) ══ */}
            {budget > 0 && (
                <SpendingManagementPanel budget={budget} sectionLabel={sectionLabel} />
            )}

            {/* ── Anomaly Alerts ── */}
            {anomalies.length > 0 && (
                <section id="anomaly-alerts" aria-label="Spending anomaly alerts">
                    {sectionLabel('⚠️ Alerts')}
                    <AnomalyAlertBanner anomalies={anomalies} onFilterToCategory={() => {}} />
                </section>
            )}

            {/* ── Spending Personality ── */}
            <section id="personality" aria-label="Spending Personality Score">
                {sectionLabel('🧠 Spending Personality')}
                <Suspense fallback={<SkeletonCard height={200} label="Analyzing personality..." />}>
                    <PersonalityScoreCard budget={budget} />
                </Suspense>
            </section>

            {/* ── Forecast + Streaks ── */}
            <section id="forecast-streaks" aria-label="Forecast and Streaks">
                {sectionLabel('📈 Forecast & Gamification')}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    {budget > 0 ? (
                        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '1rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Month Forecast
                            </div>
                            <ForecastCard transactions={transactions} budget={budget} selectedMonthStr={selectedMonthStr} />
                        </div>
                    ) : (
                        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '1rem', border: '1px dashed var(--border)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>💰</div>
                            Set a monthly budget to unlock forecasting
                        </div>
                    )}
                    <Suspense fallback={<SkeletonCard height={220} label="Loading streaks..." />}>
                        <StreakDisplay transactions={transactions} budget={budget} />
                    </Suspense>
                </div>
            </section>

            {/* ── Spending Heatmap ── */}
            <section id="heatmap" aria-label="Spending Heatmap">
                {sectionLabel('🗓️ Spending Heatmap')}
                <Suspense fallback={<SkeletonCard height={180} label="Building heatmap..." />}>
                    <SpendingHeatmap transactions={transactions} />
                </Suspense>
            </section>

            {/* ── Peer Benchmarks + Correlations ── */}
            <section id="benchmarks-correlations" aria-label="Peer Benchmarks and Category Correlations">
                {sectionLabel('👥 Peer Benchmarks & Correlations')}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    <Suspense fallback={<SkeletonCard height={280} label="Loading benchmarks..." />}>
                        <PeerBenchmarkPanel transactions={transactions} budget={budget} />
                    </Suspense>
                    <Suspense fallback={<SkeletonCard height={280} label="Computing correlations..." />}>
                        <CorrelationMatrix transactions={transactions} />
                    </Suspense>
                </div>
            </section>

            {/* ── Cash Flow Timeline ── */}
            <section id="cash-flow" aria-label="Cash Flow Timeline">
                {sectionLabel('💰 Cash Flow & Income')}
                <CashFlowTimeline transactions={transactions} budget={budget} />
            </section>

        </div>
    );
}
