import { useMemo, useState, Fragment } from 'react';
import { calculateCategoryCorrelations } from '../../utils/analytics';
import { useMediaQuery } from '../../utils/useMediaQuery';

// Diverging color: red (+1) → white (0) → blue (-1)
function corrColor(r) {
    if (r > 0) {
        const g = Math.round(255 * (1 - r));
        return `rgb(255,${g},${g})`;
    } else {
        const val = Math.round(255 * (1 + r));
        return `rgb(${val},${val},255)`;
    }
}

export default function CorrelationMatrix({ transactions }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [tooltip, setTooltip] = useState(null);

    const result = useMemo(() => calculateCategoryCorrelations(transactions), [transactions]);

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: isMobile ? '1rem' : '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        overflowX: 'auto',
    };

    if (result.insufficient) {
        return (
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Category Correlations</h3>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔬</div>
                    Need 30+ days of data for reliable correlations
                    {result.daysNeeded > 0 && <div style={{ marginTop: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>({result.daysNeeded} more days)</div>}
                </div>
            </div>
        );
    }

    const { matrix, categories, insights } = result;
    const CELL_SIZE = Math.max(isMobile ? 28 : 36, Math.floor(280 / categories.length));

    return (
        <div style={cardStyle}>
            <h3 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700 }}>Category Correlations</h3>

            <div style={{ position: 'relative', overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `${CELL_SIZE}px repeat(${categories.length}, ${CELL_SIZE}px)`, gap: '2px', width: 'fit-content' }}>
                    {/* Header row */}
                    <div />
                    {categories.map(cat => (
                        <div key={cat} style={{
                            width: CELL_SIZE, height: CELL_SIZE,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: Math.max(8, CELL_SIZE * 0.22),
                            color: 'var(--text-secondary)', fontWeight: 700,
                            transform: 'rotate(-45deg)', overflow: 'hidden',
                            transformOrigin: 'center center',
                        }}>
                            {cat.split(' ')[0].slice(0, 4)}
                        </div>
                    ))}

                    {/* Data rows */}
                    {categories.map(rowCat => (
                        <Fragment key={`row-${rowCat}`}>
                            <div style={{
                                width: CELL_SIZE, height: CELL_SIZE,
                                display: 'flex', alignItems: 'center',
                                fontSize: Math.max(8, CELL_SIZE * 0.22),
                                color: 'var(--text-secondary)', fontWeight: 700,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                paddingRight: '4px',
                            }}>
                                {rowCat.split(' ')[0].slice(0, 5)}
                            </div>
                            {categories.map(colCat => {
                                const r = matrix[rowCat]?.[colCat] ?? 0;
                                const isDiagonal = rowCat === colCat;
                                return (
                                    <div
                                        key={`${rowCat}-${colCat}`}
                                        onMouseEnter={() => !isDiagonal && setTooltip({ rowCat, colCat, r })}
                                        onMouseLeave={() => setTooltip(null)}
                                        style={{
                                            width: CELL_SIZE, height: CELL_SIZE,
                                            background: isDiagonal ? 'var(--primary)' : corrColor(r),
                                            borderRadius: '3px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: Math.max(7, CELL_SIZE * 0.24),
                                            color: Math.abs(r) > 0.5 ? '#fff' : '#111',
                                            fontWeight: 700,
                                            cursor: isDiagonal ? 'default' : 'pointer',
                                            opacity: isDiagonal ? 0.9 : 1,
                                        }}
                                        title={isDiagonal ? rowCat : `${rowCat} × ${colCat}: r=${r.toFixed(2)}`}
                                        aria-label={isDiagonal ? rowCat : `Correlation between ${rowCat} and ${colCat}: ${r.toFixed(2)}`}
                                    >
                                        {isDiagonal ? '1' : r.toFixed(1)}
                                    </div>
                                );
                            })}
                        </Fragment>
                    ))}
                </div>

                {/* Tooltip */}
                {tooltip && (
                    <div style={{
                        position: 'fixed', bottom: '2rem', right: '2rem',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: '0.625rem', padding: '0.75rem 1rem',
                        fontSize: '0.78rem', zIndex: 100, maxWidth: '260px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                            {tooltip.rowCat} × {tooltip.colCat}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            {tooltip.r > 0.3 ? `When you spend on ${tooltip.rowCat}, ${tooltip.colCat} tends to also be ${Math.round(tooltip.r * 100)}% higher on the same day.`
                            : tooltip.r < -0.3 ? `${tooltip.rowCat} and ${tooltip.colCat} rarely spike together.`
                            : 'These categories show little correlation.'}
                        </div>
                        <div style={{ marginTop: '0.3rem', color: 'var(--primary)', fontWeight: 700 }}>r = {tooltip.r.toFixed(2)}</div>
                    </div>
                )}
            </div>

            {/* Color legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 14, height: 14, background: 'rgb(255,100,100)', borderRadius: 2 }} /> Strong +
                <div style={{ width: 14, height: 14, background: 'rgb(255,255,255)', borderRadius: 2, border: '1px solid var(--border)' }} /> None
                <div style={{ width: 14, height: 14, background: 'rgb(100,100,255)', borderRadius: 2 }} /> Strong −
            </div>

            {/* Auto-insights */}
            {insights && insights.length > 0 && (
                <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {insights.map((ins, i) => (
                        <div key={i} style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', padding: '0.4rem 0.6rem', background: 'var(--input-bg)', borderRadius: '0.375rem' }}>
                            🔗 {ins}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
