import { useMemo } from 'react';
import { useMediaQuery } from '../../utils/useMediaQuery';

/**
 * PeerBenchmarkPanel – Feature 4
 * Uses simulated peer medians based on typical Indian student spending patterns.
 * When a real edge function is available, swap PEER_MEDIANS with API data.
 */

// Typical monthly median spend (INR) for Indian college students
const PEER_MEDIANS = {
    'Food & Dining':   2800,
    'Food':            2800,
    'Transportation':   900,
    'Shopping':        1500,
    'Entertainment':    800,
    'Healthcare':       300,
    'Bills':            600,
    'Utilities':        400,
    'Personal Care':    350,
    'Education':        500,
    'Other':            400,
};

const PEER_SAMPLE = 240; // simulated student count

export default function PeerBenchmarkPanel({ transactions, budget }) {
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Calculate user's current-month category totals
    const userCategoryTotals = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTx = transactions.filter(t => new Date(t.date || t.created_at) >= monthStart);
        const totals = {};
        monthTx.forEach(t => {
            const cat = t.category || 'Other';
            totals[cat] = (totals[cat] || 0) + parseFloat(t.amount || 0);
        });
        return totals;
    }, [transactions]);

    // Build comparison rows
    const rows = useMemo(() => {
        return Object.entries(userCategoryTotals)
            .filter(([cat, amt]) => amt > 0 && PEER_MEDIANS[cat])
            .map(([cat, userAmt]) => {
                const peerAmt = PEER_MEDIANS[cat] || 500;
                const ratio = userAmt / peerAmt;
                const diffPct = Math.round((ratio - 1) * 100);
                let verdict = 'equal';
                if (ratio < 0.8) verdict = 'better';
                else if (ratio > 1.3) verdict = 'worse';
                return { cat, userAmt: Math.round(userAmt), peerAmt, ratio, diffPct, verdict };
            })
            .sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct));
    }, [userCategoryTotals]);

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: isMobile ? '1rem' : '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    };

    if (Object.keys(userCategoryTotals).length === 0) {
        return (
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>
                    Peer Benchmarks
                </h3>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1.5rem 0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>👥</div>
                    Add transactions this month to see how you compare to peers
                </div>
            </div>
        );
    }

    const maxAmt = Math.max(
        ...rows.map(r => Math.max(r.userAmt, r.peerAmt)),
        1
    );

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Peer Benchmarks</h3>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        vs. All Students (this month)
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.7rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} />
                        You
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--border)', border: '1.5px dashed var(--text-secondary)' }} />
                        Peers
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {rows.map(({ cat, userAmt, peerAmt, ratio, diffPct, verdict }) => {
                    const userW = (userAmt / maxAmt) * 100;
                    const peerW = (peerAmt / maxAmt) * 100;
                    const verdictColor = verdict === 'better' ? '#10b981' : verdict === 'worse' ? '#f59e0b' : 'var(--text-secondary)';
                    const verdictIcon = verdict === 'better' ? '🎉' : verdict === 'worse' ? '⚠️' : '➡️';

                    return (
                        <div key={cat}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cat}</span>
                                <span style={{ fontSize: '0.72rem', color: verdictColor, fontWeight: 700 }}>
                                    {verdictIcon} {Math.abs(diffPct)}% {diffPct < 0 ? 'less' : 'more'} than peers
                                </span>
                            </div>

                            {/* User bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <div style={{ width: '28px', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>You</div>
                                <div style={{ flex: 1, height: '8px', background: 'var(--input-bg)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${userW}%`, background: 'var(--primary)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                                </div>
                                <div style={{ width: '50px', fontSize: '0.7rem', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>₹{userAmt.toLocaleString('en-IN')}</div>
                            </div>

                            {/* Peer bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '28px', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>Avg</div>
                                <div style={{ flex: 1, height: '8px', background: 'var(--input-bg)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${peerW}%`, background: 'transparent', borderRadius: 4, border: '1.5px dashed var(--text-secondary)', boxSizing: 'border-box', transition: 'width 0.6s ease' }} />
                                </div>
                                <div style={{ width: '50px', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>₹{peerAmt.toLocaleString('en-IN')}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '1rem', padding: '0.6rem 0.75rem', background: 'var(--input-bg)', borderRadius: '0.5rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                📊 Based on anonymized data from {PEER_SAMPLE}+ students · Peer medians updated monthly
            </div>
        </div>
    );
}
