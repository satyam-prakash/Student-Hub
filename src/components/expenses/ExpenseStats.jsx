import { DollarSign, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useMediaQuery } from '../../utils/useMediaQuery';

// Dummy data for the sparkline chart
const sparklineData = [
    { value: 100 }, { value: 120 }, { value: 90 }, { value: 150 }, 
    { value: 130 }, { value: 180 }, { value: 200 }
];

export default function ExpenseStats({ expenses }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const walletTotals = expenses.reduce((acc, exp) => {
        acc[exp.wallet] = (acc[exp.wallet] || 0) + parseFloat(exp.amount);
        return acc;
    }, {});

    const cardStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '1.25rem' : '0.75rem 1rem',
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        flex: 1,
        minWidth: isMobile ? '220px' : '200px'
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'stretch' }}>

            {/* Cash Spending */}
            <div style={cardStyle}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginRight: isMobile ? '1rem' : '0.75rem' }}>
                    <Wallet size={isMobile ? 20 : 18} />
                </div>
                <div>
                    <p className="text-secondary" style={{ fontSize: isMobile ? '0.75rem' : '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Spending</p>
                    <p style={{ fontSize: isMobile ? '1.25rem' : '1.1rem', fontWeight: 'bold' }}>₹{(walletTotals['Cash'] || 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Digital Spending */}
            <div style={cardStyle}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', marginRight: isMobile ? '1rem' : '0.75rem' }}>
                    <CreditCard size={isMobile ? 20 : 18} />
                </div>
                <div>
                    <p className="text-secondary" style={{ fontSize: isMobile ? '0.75rem' : '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digital (UPI/Card)</p>
                    <p style={{ fontSize: isMobile ? '1.25rem' : '1.1rem', fontWeight: 'bold' }}>
                        ₹{((walletTotals['UPI'] || 0) + (walletTotals['Card'] || 0) + (walletTotals['Bank'] || 0)).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* AI Insight */}
            <div style={{ ...cardStyle, flex: '1.5' }}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(251, 191, 36, 0.1)', color: 'var(--warning)', marginRight: isMobile ? '1rem' : '0.75rem' }}>
                    <AlertCircle size={isMobile ? 20 : 18} />
                </div>
                <div>
                    <p className="text-secondary" style={{ fontSize: isMobile ? '0.75rem' : '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Insight</p>
                    <p style={{ fontSize: isMobile ? '0.875rem' : '0.8rem', fontWeight: '500', marginTop: '0.25rem' }}>Spending within budget, great job!</p>
                </div>
            </div>
        </div>
    );
}
