import { useState, useEffect } from 'react';
import { Search, Trash2, Utensils, Bus, ShoppingBag, Coffee, FileText, Smartphone, LayoutDashboard } from 'lucide-react';

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
    // In mobile, we might omit the year for current year to save space. Desktop has enough space.
    if (isMobile && isCurrentYear) {
        return expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ExpenseList({ expenses, onEdit, onDelete, onSearch, filters, setFilters }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // set initial
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden', minHeight: '300px' }}>
            {/* Header Area */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Recent Transactions</h3>
                
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input 
                            type="text" 
                            placeholder="Search" 
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                            style={{ 
                                paddingLeft: '2.5rem', 
                                paddingRight: '1rem', 
                                paddingTop: '0.5rem',
                                paddingBottom: '0.5rem',
                                backgroundColor: 'var(--input-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                color: 'var(--text)',
                                width: '200px',
                                outline: 'none'
                             }} 
                        />
                    </div>
                    
                    <select 
                        value={filters.category} 
                        onChange={e => setFilters({...filters, category: e.target.value})}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                        <option value="All">Category</option>
                        <option value="Food">Food</option>
                        <option value="Transportation">Transport</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Shopping">Shopping</option>
                    </select>

                    <select 
                        value={filters.wallet} 
                        onChange={e => setFilters({...filters, wallet: e.target.value})}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                        <option value="All">Wallet</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank">Bank</option>
                    </select>
                </div>
            </div>
            
            {/* Table Area */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            {!isMobile ? (
                                <>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Description</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Category</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Wallet</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Amount</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Actions</th>
                                </>
                            ) : (
                                <>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Description</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Wallet</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Amount</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Actions</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={isMobile ? "4" : "6"} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No expenses found.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => {
                                const st = getCategoryStyle(expense.category);
                                const displayDesc = expense.description ? expense.description.split(' | Note: ')[0] : ''; // Removed the '-' fallback
                                
                                return (
                                <tr 
                                    key={expense.id} 
                                    onClick={() => onEdit(expense)}
                                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }} 
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} 
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    
                                    {!isMobile ? (
                                        // Desktop Full Layout
                                        <>
                                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                                                {formatDate(expense.date, false)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>{displayDesc}</td>
                                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {getCategoryIcon(expense.category)}
                                                </div>
                                                <span>{expense.category}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{expense.wallet}</td>
                                        </>
                                    ) : (
                                        // Mobile Compact Layout
                                        <>
                                            <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', backgroundColor: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {getCategoryIcon(expense.category)}
                                                </div>
                                            </td>
                                            
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.875rem' }}>{expense.wallet}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        {formatDate(expense.date, true)}
                                                    </span>
                                                </div>
                                            </td>
                                        </>
                                    )}

                                    {/* Amount Column - Same for both */}
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>₹{parseFloat(expense.amount).toFixed(2)}</td>
                                    
                                    {/* Actions Column - Same for both */}
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--primary)', fontSize: '0.875rem', cursor: 'pointer', paddingRight: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onEdit(expense); }}>View</span>
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                                                style={{ width: '32px', height: '32px', borderRadius: '0.5rem', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}
                                                title="Delete Expense"
                                            >
                                                <Trash2 size={16} color="var(--error)" />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
