import { DollarSign, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Dummy data for the sparkline chart
const sparklineData = [
    { value: 100 }, { value: 120 }, { value: 90 }, { value: 150 }, 
    { value: 130 }, { value: 180 }, { value: 200 }
];

export default function ExpenseStats({ expenses }) {
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const walletTotals = expenses.reduce((acc, exp) => {
        acc[exp.wallet] = (acc[exp.wallet] || 0) + parseFloat(exp.amount);
        return acc;
    }, {});

    const cardStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: '1.25rem',
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        flex: 1,
        minWidth: '220px'
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {/* Total Spent Card with Sparkline */}
            <div style={{ ...cardStyle, justifyContent: 'space-between', flex: '1.5' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(255, 102, 0, 0.1)', color: 'var(--primary)', marginRight: '1rem' }}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent (This Month)</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{totalSpent.toFixed(2)}</p>
                    </div>
                </div>
                <div style={{ width: '80px', height: '40px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Cash Spending */}
            <div style={cardStyle}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginRight: '1rem' }}>
                    <Wallet size={20} />
                </div>
                <div>
                    <p className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Spending</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{(walletTotals['Cash'] || 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Digital Spending */}
            <div style={cardStyle}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', marginRight: '1rem' }}>
                    <CreditCard size={20} />
                </div>
                <div>
                    <p className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digital (UPI/Card)</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        ₹{((walletTotals['UPI'] || 0) + (walletTotals['Card'] || 0) + (walletTotals['Bank'] || 0)).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* AI Insight */}
            <div style={{ ...cardStyle, flex: '1.5' }}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(251, 191, 36, 0.1)', color: 'var(--warning)', marginRight: '1rem' }}>
                    <AlertCircle size={20} />
                </div>
                <div>
                    <p className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Insight</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', marginTop: '0.25rem' }}>Spending within budget, great job!</p>
                </div>
            </div>
        </div>
    );
}
