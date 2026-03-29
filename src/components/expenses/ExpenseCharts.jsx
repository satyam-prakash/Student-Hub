import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const COLORS = ['#ff6600', '#22c55e', '#3b82f6', '#fbbf24', '#a855f7', '#ef4444', '#64748b'];

export default function ExpenseCharts({ categoriesData }) {
    return (
        <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            flex: '2'
        }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Spending by Category</h3>
            
            {categoriesData && categoriesData.length > 0 ? (
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoriesData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoriesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                formatter={(value) => `₹${value.toFixed(2)}`}
                                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                                itemStyle={{ color: 'var(--text)' }}
                            />
                            <Legend wrapperStyle={{ color: 'var(--text)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    No data available for charts
                </div>
            )}
        </div>
    );
}
