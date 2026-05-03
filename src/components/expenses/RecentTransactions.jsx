import { ArrowRight, TrendingDown, Trash2, Utensils, Bus, ShoppingBag, Coffee, Smartphone, LayoutDashboard } from 'lucide-react';

const getCategoryIcon = (cat) => {
    switch(cat?.toLowerCase()) {
        case 'food & dining':
        case 'food': return <Utensils size={16} strokeWidth={2} />;
        case 'transportation':
        case 'transport': return <Bus size={16} strokeWidth={2} />;
        case 'shopping': return <ShoppingBag size={16} strokeWidth={2} />;
        case 'entertainment': return <Coffee size={16} strokeWidth={2} />;
        case 'bills': return <Smartphone size={16} strokeWidth={2} />;
        default: return <LayoutDashboard size={16} strokeWidth={2} />;
    }
};

const getCategoryStyle = (cat) => {
    switch(cat?.toLowerCase()) {
        case 'food & dining':
        case 'food': return { bg: 'rgba(255, 102, 0, 0.2)', color: 'var(--primary)' };
        case 'transportation':
        case 'transport': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
        case 'shopping': return { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' };
        default: return { bg: 'rgba(251, 191, 36, 0.2)', color: 'var(--warning)' };
    }
};

const formatDate = (dateString, isMobile) => {
    const expDate = new Date(dateString);
    const isCurrentYear = expDate.getFullYear() === new Date().getFullYear();
    if (isMobile && isCurrentYear) {
        return expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * RecentTransactions - Shows last 5 transactions on dashboard with "View All" button
 */
export default function RecentTransactions({ transactions, onViewAll, onEdit, onDelete, isMobile }) {
    // Get 5 most recent transactions
    const recentTransactions = [...transactions]
        .sort((a, b) => {
            const dateA = new Date(a.date || a.created_at);
            const dateB = new Date(b.date || b.created_at);
            if (dateA.getTime() === dateB.getTime()) {
                // Secondary sort if dates are exactly the same
                return new Date(b.created_at) - new Date(a.created_at);
            }
            return dateB - dateA;
        })
        .slice(0, 5);

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: isMobile ? '1rem' : '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
    };

    const transactionItemStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        borderRadius: '0.625rem',
        border: '1px solid var(--border)',
        background: 'var(--input-bg)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    };

    if (recentTransactions.length === 0) {
        return (
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700 }}>
                    Recent Transactions
                </h3>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem 0', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <TrendingDown size={32} style={{ opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No transactions yet</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>
                        Add your first expense to get started
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1rem' 
            }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Recent Transactions
                </h3>
                <button
                    onClick={onViewAll}
                    aria-label="View all transactions"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: 'var(--input-bg)',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--input-bg)';
                        e.currentTarget.style.color = 'var(--primary)';
                    }}
                >
                    View All <ArrowRight size={14} />
                </button>
            </div>

            <div style={{ overflowX: 'auto', margin: '0 -1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <tbody>
                        {recentTransactions.map((transaction) => {
                            const st = getCategoryStyle(transaction.category);
                            const displayDesc = transaction.description ? transaction.description.split(' | Note: ')[0] : '';
                            
                            return (
                                <tr 
                                    key={transaction.id} 
                                    onClick={() => onEdit(transaction)}
                                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }} 
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} 
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {!isMobile ? (
                                        <>
                                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                                                {formatDate(transaction.date, false)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>{displayDesc}</td>
                                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {getCategoryIcon(transaction.category)}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600 }}>{transaction.category}</span>
                                                    {transaction.subcategory && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{transaction.subcategory}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{transaction.wallet}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', backgroundColor: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {getCategoryIcon(transaction.category)}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{transaction.category}</span>
                                                    {transaction.subcategory && (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{transaction.subcategory}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.875rem' }}>{transaction.wallet}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        {formatDate(transaction.date, true)}
                                                    </span>
                                                </div>
                                            </td>
                                        </>
                                    )}

                                    <td style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', fontWeight: 600 }}>₹{parseFloat(transaction.amount).toFixed(2)}</td>
                                    
                                    <td style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--primary)', fontSize: '0.875rem', cursor: 'pointer', paddingRight: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}>View</span>
                                            {onDelete && (
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
                                                    style={{ width: '32px', height: '32px', borderRadius: '0.5rem', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}
                                                    title="Delete Expense"
                                                >
                                                    <Trash2 size={16} color="var(--error)" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {transactions.length > 5 && (
                <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.5rem', 
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border)'
                }}>
                    Showing {recentTransactions.length} of {transactions.length} transactions
                </div>
            )}
        </div>
    );
}
