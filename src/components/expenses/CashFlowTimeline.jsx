import { useMemo, useState, useEffect, useCallback } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { expenseApi } from '../../lib/expenseApi';
import { useMediaQuery } from '../../utils/useMediaQuery';
import IncomeEventForm from './IncomeEventForm';
import { Plus, TrendingDown } from 'lucide-react';

/**
 * CashFlowTimeline - Feature 7
 * Dual-axis chart showing cumulative spending vs. income events
 */

export default function CashFlowTimeline({ transactions, budget }) {
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [incomeEvents, setIncomeEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [dateRange, setDateRange] = useState('30'); // Days to show

    const loadIncomeEvents = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const events = await expenseApi.getIncomeEvents(user.id);
            setIncomeEvents(events);
        } catch (error) {
            console.error('Failed to load income events:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadIncomeEvents();
    }, [loadIncomeEvents]);

    const handleAddEvent = async (eventData) => {
        await expenseApi.addIncomeEvent({ ...eventData, user_id: user.id });
        await loadIncomeEvents();
    };

    // Build chart data
    const chartData = useMemo(() => {
        const days = parseInt(dateRange);
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Create daily buckets
        const data = [];
        const dateMap = new Map();

        for (let i = 0; i <= days; i++) {
            const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            dateMap.set(key, {
                date: key,
                displayDate: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                dailySpend: 0,
                cumulativeSpend: 0,
                income: 0,
                availableBalance: 0,
            });
        }

        // Populate spending
        let cumulative = 0;
        const sorted = [...transactions]
            .filter((t) => {
                const tDate = new Date(t.date || t.created_at);
                return tDate >= startDate && tDate <= now;
            })
            .sort((a, b) => new Date(a.date || a.created_at) - new Date(b.date || b.created_at));

        sorted.forEach((t) => {
            const key = new Date(t.date || t.created_at).toISOString().split('T')[0];
            if (dateMap.has(key)) {
                const entry = dateMap.get(key);
                entry.dailySpend += parseFloat(t.amount || 0);
                cumulative += parseFloat(t.amount || 0);
                entry.cumulativeSpend = cumulative;
            }
        });

        // Populate income events
        incomeEvents
            .filter((e) => {
                const eDate = new Date(e.date);
                return eDate >= startDate && eDate <= now;
            })
            .forEach((e) => {
                const key = new Date(e.date).toISOString().split('T')[0];
                if (dateMap.has(key)) {
                    dateMap.get(key).income += parseFloat(e.amount || 0);
                }
            });

        // Calculate cumulative values
        let totalIncome = 0;
        let totalSpend = 0;

        dateMap.forEach((entry) => {
            totalIncome += entry.income;
            totalSpend += entry.dailySpend;
            entry.availableBalance = totalIncome - entry.cumulativeSpend;
            data.push(entry);
        });

        return data;
    }, [transactions, incomeEvents, dateRange]);

    const stats = useMemo(() => {
        const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
        const totalSpend = Math.max(...chartData.map((d) => d.cumulativeSpend), 0);
        const balance = totalIncome - totalSpend;
        return { totalIncome: Math.round(totalIncome), totalSpend: Math.round(totalSpend), balance: Math.round(balance) };
    }, [chartData]);

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: isMobile ? '1rem' : '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    };

    if (loading) {
        return (
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            border: '3px solid var(--border)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            margin: '0 auto 0.5rem',
                        }}
                        className="animate-spin"
                    />
                    Loading cash flow data...
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        const data = payload[0].payload;
        return (
            <div
                style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
            >
                <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{data.displayDate}</div>
                {data.income > 0 && <div style={{ color: '#10b981' }}>💰 Income: ₹{Math.round(data.income).toLocaleString('en-IN')}</div>}
                <div style={{ color: 'var(--primary)' }}>📉 Cumulative Spend: ₹{Math.round(data.cumulativeSpend).toLocaleString('en-IN')}</div>
                <div style={{ color: data.availableBalance < 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                    💵 Balance: ₹{Math.round(data.availableBalance).toLocaleString('en-IN')}
                </div>
            </div>
        );
    };

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>Cash Flow Timeline</h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Track income vs. cumulative spending
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Date range selector */}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: 'var(--input-bg)',
                            color: 'var(--text)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                    </select>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        aria-label="Add income event"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                        }}
                    >
                        <Plus size={14} /> Add Income
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                }}
            >
                <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Income</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>₹{stats.totalIncome.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,102,0,0.1)', border: '1px solid rgba(255,102,0,0.3)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Spent</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>₹{stats.totalSpend.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: stats.balance >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${stats.balance >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Net Balance</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: stats.balance >= 0 ? '#22c55e' : '#ef4444' }}>
                        ₹{Math.abs(stats.balance).toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Income Form */}
            {showForm && (
                <div style={{ marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
                    <IncomeEventForm onAddEvent={handleAddEvent} onClose={() => setShowForm(false)} />
                </div>
            )}

            {/* Chart */}
            {chartData.length > 0 ? (
                <div style={{ width: '100%', height: isMobile ? 240 : 320 }}>
                    <ResponsiveContainer>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                            <XAxis
                                dataKey="displayDate"
                                stroke="var(--text-secondary)"
                                fontSize={11}
                                tickLine={false}
                                interval={isMobile ? 'preserveStartEnd' : 'preserveEnd'}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="var(--text-secondary)"
                                fontSize={11}
                                tickLine={false}
                                tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="var(--text-secondary)"
                                fontSize={11}
                                tickLine={false}
                                tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            
                            {/* Budget reference line */}
                            {budget > 0 && (
                                <ReferenceLine
                                    yAxisId="left"
                                    y={budget}
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    label={{ value: 'Budget', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }}
                                />
                            )}

                            {/* Cumulative spend area */}
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="cumulativeSpend"
                                fill="url(#colorSpend)"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                name="Cumulative Spend"
                            />

                            {/* Income bars */}
                            <Bar yAxisId="right" dataKey="income" fill="#10b981" name="Income" barSize={12} />

                            <defs>
                                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <TrendingDown size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                    <div>No transactions in selected period</div>
                </div>
            )}

            {/* Danger zone highlighting */}
            {stats.balance < 0 && (
                <div
                    role="alert"
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <span style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                        Cash crunch alert: Spending exceeds income by ₹{Math.abs(stats.balance).toLocaleString('en-IN')}
                    </span>
                </div>
            )}

            {incomeEvents.length === 0 && !showForm && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.2)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    💡 Add income events to see your cash flow balance over time
                </div>
            )}
        </div>
    );
}
