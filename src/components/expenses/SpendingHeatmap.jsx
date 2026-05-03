import { useMemo, useState, useRef } from 'react';
import { buildHeatmapData, buildMonthHeatmapData } from '../../utils/analytics';
import { useMediaQuery } from '../../utils/useMediaQuery';
import { useHistoricalAnalyticsContext } from '../../hooks/useHistoricalAnalytics.jsx';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const OPACITY = [0, 0.2, 0.45, 0.65, 1.0];

const TOGGLE_OPTS = [
    { key: 'this', label: 'This Month' },
    { key: 'last', label: 'Last Month' },
    { key: 'compare', label: 'Compare' },
];

// ── Rolling heatmap (existing behaviour, for "This Month" tab) ──────────────
function RollingHeatmap({ transactions, isMobile }) {
    const weeks = isMobile ? 8 : 12;
    const CELL = isMobile ? 11 : 14;
    const GAP = 2;
    const STEP = CELL + GAP;
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);

    const data = useMemo(() => buildHeatmapData(transactions, weeks), [transactions, weeks]);
    if (!data) return null;

    const { cells, heaviestDay, heaviestAvg, dayAvgs } = data;
    const LABEL_W = 28;
    const HEADER_H = 18;
    const svgW = LABEL_W + weeks * STEP;
    const svgH = HEADER_H + 7 * STEP + 4;

    const monthLabels = [];
    let lastMonth = -1;
    cells.filter(c => c.dayOfWeek === 0).forEach(c => {
        const d = new Date(c.date);
        if (d.getMonth() !== lastMonth) {
            monthLabels.push({ week: c.week, label: MONTH_NAMES[d.getMonth()] });
            lastMonth = d.getMonth();
        }
    });

    const handleMouseEnter = (e, cell) => {
        if (cell.isFuture || cell.amount < 0) return;
        setTooltip({ x: LABEL_W + cell.week * STEP + CELL / 2, y: HEADER_H + cell.dayOfWeek * STEP, cell });
    };

    return (
        <>
            <div style={{ position: 'relative', overflowX: 'auto' }}>
                <svg ref={svgRef} width={svgW} height={svgH + 20}
                    style={{ display: 'block', minWidth: svgW }} role="img" aria-label="Spending heatmap grid">
                    {monthLabels.map(({ week, label }) => (
                        <text key={`${week}-${label}`} x={LABEL_W + week * STEP} y={10} fontSize={8} fill="var(--text-secondary)" fontFamily="inherit">{label}</text>
                    ))}
                    {[0, 2, 4, 6].map(i => (
                        <text key={i} x={0} y={HEADER_H + i * STEP + CELL * 0.75} fontSize={8} fill="var(--text-secondary)" fontFamily="inherit">{DAY_LABELS[i]}</text>
                    ))}
                    {cells.map(cell => {
                        const cx = LABEL_W + cell.week * STEP;
                        const cy = HEADER_H + cell.dayOfWeek * STEP;
                        const opacity = cell.isFuture ? 0.05 : OPACITY[cell.intensity || 0];
                        return (
                            <rect key={cell.date} x={cx} y={cy} width={CELL} height={CELL} rx={3}
                                fill={cell.amount > 0 ? 'var(--primary)' : 'var(--border)'}
                                opacity={opacity}
                                style={{ cursor: cell.amount > 0 ? 'pointer' : 'default' }}
                                onMouseEnter={e => handleMouseEnter(e, cell)}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        );
                    })}
                    {[0, 1, 2, 3, 4].map(i => (
                        <rect key={`legend-${i}`} x={LABEL_W + (weeks - 7) * STEP + i * (CELL + 2)} y={svgH + 4}
                            width={CELL} height={CELL - 2} rx={2}
                            fill={i === 0 ? 'var(--border)' : 'var(--primary)'} opacity={OPACITY[i]} />
                    ))}
                    <text x={LABEL_W + (weeks - 9) * STEP} y={svgH + 11} fontSize={8} fill="var(--text-secondary)" fontFamily="inherit">Less</text>
                    <text x={LABEL_W + (weeks - 2) * STEP + 8} y={svgH + 11} fontSize={8} fill="var(--text-secondary)" fontFamily="inherit">More</text>
                </svg>
                {tooltip && tooltip.cell.amount > 0 && (
                    <div style={{
                        position: 'absolute', left: tooltip.x, top: tooltip.y - 48,
                        transform: 'translateX(-50%)', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: '0.5rem',
                        padding: '0.35rem 0.6rem', fontSize: '0.7rem',
                        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            {new Date(tooltip.cell.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Math.round(tooltip.cell.amount).toLocaleString('en-IN')}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{tooltip.cell.count} transaction{tooltip.cell.count !== 1 ? 's' : ''}</div>
                    </div>
                )}
            </div>
            {heaviestDay && heaviestAvg > 0 && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    📊 Your heaviest spending day is <strong style={{ color: 'var(--primary)' }}>{heaviestDay}</strong> (avg ₹{heaviestAvg.toLocaleString('en-IN')}/week)
                </div>
            )}
            {/* Day-of-week bar chart */}
            {dayAvgs && <DayOfWeekChart dayAvgs={dayAvgs} label="Last 12 weeks avg" color="var(--primary)" />}
        </>
    );
}

// ── Month heatmap grid ────────────────────────────────────────────────────────
function MonthGrid({ transactions, year, month, label, highlightCompare, compareTxns, isMobile }) {
    const CELL = isMobile ? 22 : 28;
    const GAP = 3;
    const STEP = CELL + GAP;
    const LABEL_W = 28;
    const HEADER_H = 20;

    const data = useMemo(() => buildMonthHeatmapData(transactions, year, month), [transactions, year, month]);
    const compareData = useMemo(() => compareTxns ? buildMonthHeatmapData(compareTxns, year, month) : null, [compareTxns, year, month]);

    if (!data) return null;
    const { cells, weeks } = data;

    const svgW = LABEL_W + weeks * STEP;
    const svgH = HEADER_H + 7 * STEP + 4;
    const [tooltip, setTooltip] = useState(null);

    return (
        <div>
            {label && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>}
            <div style={{ position: 'relative', overflowX: 'auto' }}>
                <svg width={svgW} height={svgH} style={{ display: 'block', minWidth: svgW }}>
                    {/* Day labels */}
                    {[0, 2, 4, 6].map(i => (
                        <text key={i} x={0} y={HEADER_H + i * STEP + CELL * 0.72} fontSize={8} fill="var(--text-secondary)" fontFamily="inherit">{DAY_LABELS[i]}</text>
                    ))}
                    {/* Day number header (week cols) */}
                    {cells.map(cell => {
                        if (cell.isPadding || cell.dayOfWeek !== 0) return null;
                        return (
                            <text key={`wk-${cell.week}`} x={LABEL_W + cell.week * STEP + 2} y={12}
                                fontSize={7} fill="var(--text-secondary)" fontFamily="inherit">
                                W{cell.week + 1}
                            </text>
                        );
                    })}
                    {/* Cells */}
                    {cells.map(cell => {
                        if (cell.isPadding) return null;
                        const cx = LABEL_W + cell.week * STEP;
                        const cy = HEADER_H + cell.dayOfWeek * STEP;
                        const opacity = cell.isFuture ? 0.05 : OPACITY[cell.intensity || 0];

                        // Compare mode: red tint if this month > last month on that day
                        let fill = cell.amount > 0 ? 'var(--primary)' : 'var(--border)';
                        let overlayOpacity = 0;
                        if (highlightCompare && compareData) {
                            const compareCell = compareData.cells.find(c => c.dayOfMonth === cell.dayOfMonth);
                            if (compareCell && cell.amount > compareCell.amount && compareCell.amount > 0) {
                                fill = '#ef4444';
                                overlayOpacity = Math.min((cell.amount / compareCell.amount - 1) * 0.5, 0.8);
                            }
                        }

                        return (
                            <g key={cell.date}
                                onMouseEnter={() => !cell.isFuture && cell.amount >= 0 && setTooltip({ cell, cx, cy })}
                                onMouseLeave={() => setTooltip(null)}
                                style={{ cursor: cell.amount > 0 ? 'pointer' : 'default' }}>
                                <rect x={cx} y={cy} width={CELL} height={CELL} rx={4}
                                    fill={fill} opacity={opacity} />
                                {overlayOpacity > 0 && (
                                    <rect x={cx} y={cy} width={CELL} height={CELL} rx={4}
                                        fill="#ef4444" opacity={overlayOpacity * 0.3} />
                                )}
                                {/* Day number */}
                                {CELL >= 22 && (
                                    <text x={cx + CELL / 2} y={cy + CELL - 5} textAnchor="middle"
                                        fontSize={7} fill={cell.amount > 0 ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'}
                                        fontFamily="inherit" style={{ pointerEvents: 'none' }}>
                                        {cell.dayOfMonth}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
                {tooltip && (
                    <div style={{
                        position: 'absolute', left: tooltip.cx, top: tooltip.cy - 44,
                        transform: 'translateX(-50%)', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: '0.5rem',
                        padding: '0.3rem 0.55rem', fontSize: '0.7rem',
                        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ color: 'var(--text-secondary)' }}>Day {tooltip.cell.dayOfMonth}</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {tooltip.cell.amount > 0 ? `₹${Math.round(tooltip.cell.amount).toLocaleString('en-IN')}` : 'No spend'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Day-of-week bar chart ─────────────────────────────────────────────────────
function DayOfWeekChart({ dayAvgs, compareAvgs, label, compareLabel, color = 'var(--primary)', compareColor = '#8b5cf6' }) {
    const max = Math.max(...dayAvgs, ...(compareAvgs || []), 1);
    const H = 48;
    const barW = 22;
    const gap = 8;
    const totalW = DAY_LABELS.length * (barW + gap) - gap;
    const heaviestIdx = dayAvgs.indexOf(Math.max(...dayAvgs));

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{
                display: 'flex', gap: '1rem', alignItems: 'center',
                fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.5rem',
                flexWrap: 'wrap',
            }}>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg spend by day of week</span>
                {label && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 4, borderRadius: 2, background: color, display: 'inline-block' }} />{label}</span>}
                {compareAvgs && compareLabel && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 4, borderRadius: 2, background: compareColor, display: 'inline-block' }} />{compareLabel}</span>}
            </div>
            <svg width={totalW} height={H + 24} style={{ overflow: 'visible', display: 'block' }}>
                {DAY_LABELS.map((day, i) => {
                    const x = i * (barW + gap);
                    const barHeight = max > 0 ? (dayAvgs[i] / max) * H : 0;
                    const compareHeight = compareAvgs && max > 0 ? (compareAvgs[i] / max) * H : 0;
                    const isHeaviest = i === heaviestIdx && dayAvgs[i] > 0;
                    return (
                        <g key={day}>
                            {/* Baseline bar */}
                            <rect x={x} y={H - barHeight} width={barW} height={barHeight}
                                rx={3} fill={color} opacity={isHeaviest ? 1 : 0.5} />
                            {/* Compare overlay line */}
                            {compareAvgs && compareHeight > 0 && (
                                <line x1={x} y1={H - compareHeight} x2={x + barW} y2={H - compareHeight}
                                    stroke={compareColor} strokeWidth={2} strokeLinecap="round" />
                            )}
                            {/* Amount label on heaviest */}
                            {isHeaviest && (
                                <text x={x + barW / 2} y={H - barHeight - 3} textAnchor="middle"
                                    fontSize={7} fill={color} fontFamily="inherit" fontWeight={700}>
                                    ₹{Math.round(dayAvgs[i]).toLocaleString('en-IN')}
                                </text>
                            )}
                            {/* Day label */}
                            <text x={x + barW / 2} y={H + 12} textAnchor="middle"
                                fontSize={8} fill={isHeaviest ? color : 'var(--text-secondary)'} fontFamily="inherit">
                                {day}
                            </text>
                        </g>
                    );
                })}
            </svg>
            {compareAvgs && (() => {
                const multipliers = dayAvgs.map((v, i) => compareAvgs[i] > 0 ? v / compareAvgs[i] : null);
                const maxMult = Math.max(...multipliers.filter(Boolean));
                const maxDay = multipliers.indexOf(maxMult);
                if (maxMult > 1.3 && maxDay >= 0) {
                    return (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                            📈 This month your <strong style={{ color: 'var(--primary)' }}>{DAY_LABELS[maxDay]}s</strong> are{' '}
                            <strong style={{ color: '#ef4444' }}>{maxMult.toFixed(1)}×</strong> more expensive than last month.
                        </div>
                    );
                }
                return null;
            })()}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SpendingHeatmap({ transactions }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [mode, setMode] = useState('this');
    const { thisMonth, lastMonth, thisMonthName, lastMonthName } = useHistoricalAnalyticsContext();

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonthIdx = now.getMonth();
    const lastMonthIdx = thisMonthIdx === 0 ? 11 : thisMonthIdx - 1;
    const lastMonthYear = thisMonthIdx === 0 ? thisYear - 1 : thisYear;

    // Day avgs for bar charts
    const thisMonthHeatmap = useMemo(() => buildMonthHeatmapData(thisMonth, thisYear, thisMonthIdx), [thisMonth, thisYear, thisMonthIdx]);
    const lastMonthHeatmap = useMemo(() => buildMonthHeatmapData(lastMonth, lastMonthYear, lastMonthIdx), [lastMonth, lastMonthYear, lastMonthIdx]);

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: isMobile ? '1rem' : '1rem 1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        overflowX: 'auto',
    };

    return (
        <div style={cardStyle} aria-label="Spending heatmap">
            {/* Header + Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '0.95rem', fontWeight: 700 }}>
                    Spending Heatmap
                </h3>
                {/* Toggle */}
                <div style={{
                    display: 'flex', borderRadius: '0.5rem',
                    border: '1px solid var(--border)', overflow: 'hidden',
                    background: 'var(--input-bg)',
                }}>
                    {TOGGLE_OPTS.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setMode(opt.key)}
                            aria-pressed={mode === opt.key}
                            style={{
                                padding: '0.3rem 0.65rem',
                                border: 'none',
                                borderRight: opt.key !== 'compare' ? '1px solid var(--border)' : 'none',
                                background: mode === opt.key ? 'var(--primary)' : 'transparent',
                                color: mode === opt.key ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.72rem',
                                fontWeight: mode === opt.key ? 700 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {transactions.length < 5 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem 0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗓️</div>
                    Add more transactions to see your heatmap
                </div>
            ) : (
                <>
                    {/* ── This Month ── */}
                    {mode === 'this' && (
                        <>
                            <RollingHeatmap transactions={transactions} isMobile={isMobile} />
                        </>
                    )}

                    {/* ── Last Month ── */}
                    {mode === 'last' && (
                        <>
                            {lastMonth.length < 3 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem 0' }}>
                                    No data for {lastMonthName}
                                </div>
                            ) : (
                                <>
                                    <MonthGrid
                                        transactions={lastMonth}
                                        year={lastMonthYear}
                                        month={lastMonthIdx}
                                        label={lastMonthName}
                                        isMobile={isMobile}
                                    />
                                    {lastMonthHeatmap?.dayAvgs && (
                                        <DayOfWeekChart dayAvgs={lastMonthHeatmap.dayAvgs} label={lastMonthName} />
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ── Compare ── */}
                    {mode === 'compare' && (
                        <>
                            {lastMonth.length < 3 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem 0' }}>
                                    Not enough last-month data to compare. Keep tracking!
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                        gap: '1.5rem',
                                        marginBottom: '0.75rem',
                                    }}>
                                        <MonthGrid
                                            transactions={thisMonth}
                                            year={thisYear}
                                            month={thisMonthIdx}
                                            label={`${thisMonthName} (this month)`}
                                            highlightCompare
                                            compareTxns={lastMonth}
                                            isMobile={isMobile}
                                        />
                                        <MonthGrid
                                            transactions={lastMonth}
                                            year={lastMonthYear}
                                            month={lastMonthIdx}
                                            label={`${lastMonthName} (baseline)`}
                                            isMobile={isMobile}
                                        />
                                    </div>

                                    {/* Red tint legend */}
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                        <span style={{ width: 12, height: 12, background: 'rgba(239,68,68,0.4)', borderRadius: 2, display: 'inline-block' }} />
                                        Red tint = spending higher than same day last month
                                    </div>

                                    {/* Day-of-week overlay chart */}
                                    {thisMonthHeatmap?.dayAvgs && lastMonthHeatmap?.dayAvgs && (
                                        <DayOfWeekChart
                                            dayAvgs={thisMonthHeatmap.dayAvgs}
                                            compareAvgs={lastMonthHeatmap.dayAvgs}
                                            label={thisMonthName}
                                            compareLabel={lastMonthName}
                                            color="var(--primary)"
                                            compareColor="#8b5cf6"
                                        />
                                    )}
                                </>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
