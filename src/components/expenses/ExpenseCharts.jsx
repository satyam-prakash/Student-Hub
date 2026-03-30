import { useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    Tooltip as RechartsTooltip, Legend,
    XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts';
import { useMediaQuery } from '../../utils/useMediaQuery';

const COLORS = ['#ff6600', '#22c55e', '#3b82f6', '#fbbf24', '#a855f7', '#ef4444', '#64748b'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RANGES = [
    { key: 'week',  label: 'Week'  },
    { key: 'weeks', label: 'Weeks' },
    { key: 'month', label: 'Month' },
    { key: 'year',  label: 'Year'  },
];

/* ─── data builders ─── */
function buildWeek(expenses) {
    // Show last 7 days
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return {
            label: i === 6 ? 'Today' : DAY_LABELS[d.getDay()],
            date: d.toDateString(),
            amount: 0,
        };
    }).map(slot => {
        expenses.forEach(e => {
            if (new Date(e.date || e.created_at).toDateString() === slot.date)
                slot.amount += parseFloat(e.amount || 0);
        });
        return slot;
    });
}

function buildWeeks(expenses) {
    // Show last 8 weeks
    const today = new Date();
    return Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (7 - i) * 7 - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return {
            label: `W${i + 1}`,
            tooltip: `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
            start: weekStart,
            end: weekEnd,
            amount: 0,
        };
    }).map(slot => {
        expenses.forEach(e => {
            const d = new Date(e.date || e.created_at);
            if (d >= slot.start && d <= slot.end)
                slot.amount += parseFloat(e.amount || 0);
        });
        return slot;
    });
}

function buildMonth(expenses) {
    // Show last 30 days
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (29 - i));
        return {
            label: `${d.getDate()}`,
            tooltip: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            date: d.toDateString(),
            amount: 0,
        };
    }).map(slot => {
        expenses.forEach(e => {
            if (new Date(e.date || e.created_at).toDateString() === slot.date)
                slot.amount += parseFloat(e.amount || 0);
        });
        return slot;
    });
}

function buildYear(expenses) {
    // Show last 12 months
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
        return {
            label: MONTH_NAMES[d.getMonth()],
            year: d.getFullYear(),
            month: d.getMonth(),
            amount: 0,
        };
    }).map(slot => {
        expenses.forEach(e => {
            const d = new Date(e.date || e.created_at);
            if (d.getFullYear() === slot.year && d.getMonth() === slot.month)
                slot.amount += parseFloat(e.amount || 0);
        });
        return slot;
    });
}

/* ─── tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {payload[0]?.payload?.tooltip || label}
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                ₹{(payload[0].value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
        </div>
    );
};

/* ─── pill toggle ─── */
function RangeTabs({ value, onChange }) {
    return (
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--input-bg)', borderRadius: '0.6rem', padding: '0.2rem' }}>
            {RANGES.map(r => (
                <button
                    key={r.key}
                    onClick={() => onChange(r.key)}
                    style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '0.45rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: value === r.key ? 'var(--primary)' : 'transparent',
                        color: value === r.key ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.18s ease',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {r.label}
                </button>
            ))}
        </div>
    );
}

/* ═══════════ MAIN ═══════════ */
export default function ExpenseCharts({ categoriesData, expenses = [], monthlyBudget = 0 }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [range, setRange] = useState('week');

    /* build chart data from client-side expenses array */
    const chartData = useMemo(() => {
        switch (range) {
            case 'week':  return buildWeek(expenses);
            case 'weeks': return buildWeeks(expenses);
            case 'month': return buildMonth(expenses);
            case 'year':  return buildYear(expenses);
            default:      return buildWeek(expenses);
        }
    }, [range, expenses]);

    // Calculate metrics for the current period
    const totalSpent = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.amount, 0);
    }, [chartData]);

    const transactionCount = useMemo(() => {
        // Count transactions in current period based on range
        const now = new Date();
        let startDate;
        
        switch (range) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 6));
                break;
            case 'weeks':
                startDate = new Date(now.setDate(now.getDate() - 55)); // 8 weeks
                break;
            case 'month':
                startDate = new Date(now.setDate(now.getDate() - 29));
                break;
            case 'year':
                startDate = new Date(now.setMonth(now.getMonth() - 11));
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 6));
        }
        
        return expenses.filter(e => {
            const d = new Date(e.date || e.created_at);
            return d >= startDate;
        }).length;
    }, [expenses, range]);

    const budgetPct = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
    const avgPerTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    const peak = chartData.reduce((a, b) => b.amount > a.amount ? b : a, chartData[0] || { amount: 0 });
    const rangeLabel = RANGES.find(r => r.key === range)?.label || '';

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: isMobile ? '1.25rem' : '1rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '2' }}>
            
            {/* ── Hero Metrics ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {/* Total Spent */}
                <div style={{ background: 'linear-gradient(135deg, var(--primary), #cc4400)', borderRadius: '0.875rem', padding: isMobile ? '0.875rem' : '1rem', color: '#fff' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.85, marginBottom: '0.3rem' }}>
                        Total Spent ({rangeLabel})
                    </div>
                    <div style={{ fontSize: isMobile ? '1.3rem' : '1.4rem', fontWeight: 900, lineHeight: 1 }}>
                        ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </div>

                {/* vs Budget */}
                {monthlyBudget > 0 && range === 'month' && (
                    <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: isMobile ? '0.875rem' : '1rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                            vs Budget
                        </div>
                        <div style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 800, color: budgetPct >= 100 ? '#ef4444' : '#10b981' }}>
                            {budgetPct.toFixed(0)}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            ₹{Math.abs(monthlyBudget - totalSpent).toLocaleString('en-IN', { maximumFractionDigits: 0 })} {totalSpent > monthlyBudget ? 'over' : 'saved'}
                        </div>
                    </div>
                )}

                {/* Transactions */}
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: isMobile ? '0.875rem' : '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        Transactions
                    </div>
                    <div style={{ fontSize: isMobile ? '1.3rem' : '1.4rem', fontWeight: 900 }}>
                        {transactionCount}
                    </div>
                    {transactionCount > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            avg ₹{avgPerTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    )}
                </div>

                {/* Peak Spending */}
                {peak?.amount > 0 && (
                    <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: isMobile ? '0.875rem' : '1rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                            Peak Spending
                        </div>
                        <div style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                            ₹{peak.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {peak.tooltip || peak.label}
                        </div>
                    </div>
                )}
            </div>

            {/* Budget Progress Bar */}
            {monthlyBudget > 0 && range === 'month' && (
                <div style={{ ...cardStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        <span>Monthly Budget Usage</span>
                        <span style={{ fontWeight: 700, color: budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#10b981' }}>
                            ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / ₹{monthlyBudget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(budgetPct, 100)}%`,
                            borderRadius: 999,
                            background: budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#10b981',
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>

            {/* ── Spending Trend (time-range) ── */}
            <div style={{ ...cardStyle, flex: '1.4' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '1rem' : '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1rem', fontWeight: 700 }}>
                            Spending Analysis
                        </h3>
                        {peak?.amount > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem', display: 'block' }}>
                                Peak: <strong style={{ color: 'var(--primary)' }}>{peak.tooltip || peak.label}</strong>
                                {' '}· ₹{peak.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                        )}
                    </div>
                    <RangeTabs value={range} onChange={setRange} />
                </div>

                <div style={{ height: isMobile ? '200px' : '170px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                            <defs>
                                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: '0.65rem', fill: 'var(--text-secondary)' }}
                                axisLine={false} tickLine={false}
                                interval={range === 'month' ? 4 : range === 'year' ? 1 : 0}
                            />
                            <YAxis
                                tick={{ fontSize: '0.62rem', fill: 'var(--text-secondary)' }}
                                axisLine={false} tickLine={false}
                                tickFormatter={v => v === 0 ? '' : `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="var(--primary)"
                                strokeWidth={2.5}
                                fill="url(#trendGrad)"
                                dot={{ r: range === 'year' ? 2 : range === 'month' ? 0 : 4, fill: 'var(--primary)', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--surface)', strokeWidth: 2 }}
                                animationDuration={500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Spending by Category Pie ── */}
            <div style={{ ...cardStyle, flex: '1' }}>
                <h3 style={{ marginBottom: isMobile ? '1rem' : '0.875rem', fontSize: isMobile ? '1.1rem' : '1rem', fontWeight: 700 }}>
                    Spending by Category
                </h3>

                {categoriesData?.length > 0 ? (
                    isMobile ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoriesData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {categoriesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={v => `₹${parseFloat(v).toFixed(0)}`} contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} />
                                    <Legend wrapperStyle={{ color: 'var(--text)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', height: '170px' }}>
                            <div style={{ flex: '1', height: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoriesData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                                            {categoriesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip formatter={v => `₹${parseFloat(v).toFixed(0)}`} contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)', borderRadius: '0.5rem' }} itemStyle={{ color: 'var(--text)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ flex: '1.1', display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border)', justifyContent: 'center', overflowY: 'auto', maxHeight: '170px' }}>
                                {categoriesData.map((cat, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <div style={{ width: 9, height: 9, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{cat.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                                            ₹{parseFloat(cat.value).toFixed(0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    <div style={{ height: isMobile ? 300 : 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        No data available
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
