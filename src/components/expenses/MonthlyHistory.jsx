import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechTooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar, ReceiptText } from 'lucide-react';
import { expenseApi } from '../../lib/expenseApi';
import { useMediaQuery } from '../../utils/useMediaQuery';

/* ─── constants ─── */
const COLORS = ['#ff6600', '#22c55e', '#3b82f6', '#fbbf24', '#a855f7', '#ef4444', '#64748b', '#0ea5e9'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

/* ─── helpers ─── */
function fmt(n) { return new Intl.NumberFormat('en-IN').format(Math.round(n || 0)); }

function getMonthRange(year, month) {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end   = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return { start, end };
}

/* Build list of last N months (excluding current) */
function buildMonthList(n = 12) {
    const now = new Date();
    const list = [];
    for (let i = 1; i <= n; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        list.push({ year: d.getFullYear(), month: d.getMonth(), label: `${FULL_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    }
    return list;
}

/* ─── custom tooltip for bar chart ─── */
const BarTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.6rem', padding: '0.5rem 0.875rem' }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                ₹{fmt(payload[0].value)}
            </p>
        </div>
    );
};

/* ═══════════════════════════════════════════ */
export default function MonthlyHistory({ userId, monthlyBudget = 9000 }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const monthList = buildMonthList(12);

    /* ── state ── */
    const [selectedIdx, setSelectedIdx] = useState(0);           // index into monthList
    const [monthData, setMonthData]     = useState(null);        // { expenses, categories, total }
    const [trendData, setTrendData]     = useState([]);          // 6-month bar data
    const [loadingMonth, setLoadingMonth] = useState(false);
    const [loadingTrend, setLoadingTrend] = useState(false);

    const selected = monthList[selectedIdx];

    /* ── fetch 6-month trend on mount ── */
    useEffect(() => {
        if (!userId) return;
        (async () => {
            setLoadingTrend(true);
            try {
                const now = new Date();
                const bars = [];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const { start, end } = getMonthRange(d.getFullYear(), d.getMonth());
                    const exps = await expenseApi.getExpenses(userId, { startDate: start, endDate: end });
                    const total = exps.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                    bars.push({
                        label: MONTH_NAMES[d.getMonth()] + (i === 0 ? ' ★' : ''),
                        month: MONTH_NAMES[d.getMonth()],
                        total,
                        isCurrent: i === 0
                    });
                }
                setTrendData(bars);
            } catch (e) {
                console.error('Trend fetch error', e);
            } finally {
                setLoadingTrend(false);
            }
        })();
    }, [userId]);

    /* ── fetch selected month detail ── */
    const fetchMonth = useCallback(async () => {
        if (!userId || !selected) return;
        setLoadingMonth(true);
        try {
            const { start, end } = getMonthRange(selected.year, selected.month);
            const exps = await expenseApi.getExpenses(userId, { startDate: start, endDate: end });
            const catMap = {};
            exps.forEach(e => {
                const amt = parseFloat(e.amount || 0);
                catMap[e.category] = (catMap[e.category] || 0) + amt;
            });
            const categories = Object.entries(catMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
            const total = exps.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            setMonthData({ expenses: exps, categories, total });
        } catch (e) {
            console.error('Month fetch error', e);
        } finally {
            setLoadingMonth(false);
        }
    }, [userId, selected?.year, selected?.month]);

    useEffect(() => { fetchMonth(); }, [fetchMonth]);

    /* ── derived ── */
    const prevMonth = monthList[selectedIdx + 1];
    let vsLast = null;
    if (monthData && trendData.length >= 2) {
        // compare against the bar that is one month before selected
        const selDate   = new Date(selected.year, selected.month, 1);
        const prevDate  = new Date(selDate.getFullYear(), selDate.getMonth() - 1, 1);
        const prevBar   = trendData.find(b => b.label === MONTH_NAMES[prevDate.getMonth()]);
        if (prevBar) {
            vsLast = monthData.total - prevBar.total;
        }
    }
    const budgetPct = monthlyBudget > 0 ? Math.min((monthData?.total || 0) / monthlyBudget * 100, 100) : 0;
    const topExpenses = (monthData?.expenses || []).slice(0, 5);

    const cardBase = {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
    };

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            {/* ── Section heading ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,102,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Monthly History &amp; Analysis</h2>
            </div>

            {/* ── 6-Month Trend Bar ── */}
            <div style={{ ...cardBase, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>6-Month Spending Trend</span>
                    {monthlyBudget > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '0.2rem 0.6rem', borderRadius: '0.4rem' }}>
                            Budget: ₹{fmt(monthlyBudget)}/mo
                        </span>
                    )}
                </div>
                {loadingTrend ? (
                    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={trendData} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: '0.7rem', fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: '0.65rem', fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false}
                                tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                            <RechTooltip content={<BarTip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                            {monthlyBudget > 0 && (
                                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                    {trendData.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={entry.isCurrent
                                                ? 'var(--primary)'
                                                : entry.total > monthlyBudget
                                                    ? '#ef4444'
                                                    : 'var(--border)'}
                                            opacity={entry.isCurrent ? 1 : 0.75}
                                        />
                                    ))}
                                </Bar>
                            )}
                            {!monthlyBudget && (
                                <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Month Selector ── */}
            <div style={{ ...cardBase, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <button
                        onClick={() => setSelectedIdx(i => Math.min(i + 1, monthList.length - 1))}
                        disabled={selectedIdx >= monthList.length - 1}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: selectedIdx >= monthList.length - 1 ? 'var(--border)' : 'var(--text)', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', cursor: selectedIdx >= monthList.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                        <ChevronLeft size={15} /> Prev
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{selected?.label}</div>
                        {monthData && !loadingMonth && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                {monthData.expenses.length} transaction{monthData.expenses.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setSelectedIdx(i => Math.max(i - 1, 0))}
                        disabled={selectedIdx <= 0}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: selectedIdx <= 0 ? 'var(--border)' : 'var(--text)', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', cursor: selectedIdx <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                        Next <ChevronRight size={15} />
                    </button>
                </div>

                {/* ── Month Quick-Chips ── */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    {monthList.slice(0, 6).map((m, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedIdx(i)}
                            style={{
                                background: selectedIdx === i ? 'var(--primary)' : 'var(--input-bg)',
                                border: `1px solid ${selectedIdx === i ? 'var(--primary)' : 'var(--border)'}`,
                                color: selectedIdx === i ? '#fff' : 'var(--text-secondary)',
                                borderRadius: '999px',
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {MONTH_NAMES[m.month]} {m.year !== new Date().getFullYear() ? m.year : ''}
                        </button>
                    ))}
                </div>

                {/* ── Loading ── */}
                {loadingMonth && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', gap: '0.75rem' }}>
                        <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Loading {selected?.label}…</span>
                    </div>
                )}

                {!loadingMonth && monthData && (
                    <>
                        {/* ── Hero Totals ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            {/* Total */}
                            <div style={{ background: 'linear-gradient(135deg, var(--primary), #cc4400)', borderRadius: '0.875rem', padding: '1rem', color: '#fff' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.85, marginBottom: '0.3rem' }}>Total Spent</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>₹{fmt(monthData.total)}</div>
                            </div>

                            {/* vs Budget */}
                            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>vs Budget</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: budgetPct >= 100 ? '#ef4444' : '#10b981' }}>
                                    {budgetPct.toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                    ₹{fmt(Math.abs(monthlyBudget - monthData.total))} {monthData.total > monthlyBudget ? 'over' : 'saved'}
                                </div>
                            </div>

                            {/* vs Last Month */}
                            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>vs Prev Month</div>
                                {vsLast !== null ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        {vsLast > 0
                                            ? <TrendingUp size={16} color="#ef4444" />
                                            : vsLast < 0
                                                ? <TrendingDown size={16} color="#10b981" />
                                                : <Minus size={16} color="var(--text-secondary)" />
                                        }
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: vsLast > 0 ? '#ef4444' : vsLast < 0 ? '#10b981' : 'var(--text)' }}>
                                            {vsLast > 0 ? '+' : ''}{vsLast < 0 ? '-' : ''}₹{fmt(Math.abs(vsLast))}
                                        </span>
                                    </div>
                                ) : <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>—</div>}
                            </div>

                            {/* Transactions */}
                            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Transactions</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{monthData.expenses.length}</div>
                                {monthData.expenses.length > 0 && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                        avg ₹{fmt(monthData.total / monthData.expenses.length)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Budget progress bar */}
                        {monthlyBudget > 0 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                    <span>Budget usage</span>
                                    <span style={{ fontWeight: 700, color: budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#10b981' }}>
                                        ₹{fmt(monthData.total)} / ₹{fmt(monthlyBudget)}
                                    </span>
                                </div>
                                <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${budgetPct}%`,
                                        borderRadius: 999,
                                        background: budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#10b981',
                                        transition: 'width 0.8s ease'
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* ── Category breakdown + Top transactions ── */}
                        {monthData.expenses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                No expenses recorded for {selected?.label}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

                                {/* Pie breakdown */}
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        By Category
                                    </div>
                                    {monthData.categories.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie
                                                    data={monthData.categories}
                                                    cx="50%" cy="50%"
                                                    innerRadius={50} outerRadius={80}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {monthData.categories.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechTooltip
                                                    formatter={v => `₹${fmt(v)}`}
                                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)' }}
                                                    itemStyle={{ color: 'var(--text)' }}
                                                />
                                                <Legend
                                                    formatter={v => <span style={{ color: 'var(--text)', fontSize: '0.72rem' }}>{v}</span>}
                                                    iconType="circle" iconSize={8}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '1rem 0' }}>No data</div>
                                    )}
                                </div>

                                {/* Top transactions */}
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <ReceiptText size={13} /> Top Transactions
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {topExpenses.map((exp, i) => (
                                            <div key={exp.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', background: 'var(--input-bg)', borderRadius: '0.625rem' }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${COLORS[i % COLORS.length]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: COLORS[i % COLORS.length], flexShrink: 0 }}>
                                                    #{i + 1}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {exp.description || exp.category}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                                        {exp.category} · {exp.wallet} · {new Date(exp.date || exp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', flexShrink: 0 }}>
                                                    ₹{fmt(exp.amount)}
                                                </div>
                                            </div>
                                        ))}

                                        {monthData.expenses.length > 5 && (
                                            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', paddingTop: '0.25rem' }}>
                                                +{monthData.expenses.length - 5} more transactions
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
