import { useState } from 'react';
import { AlertTriangle, Edit2, Check, X, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { useMediaQuery } from '../../utils/useMediaQuery';

export default function BudgetStatus({ totalSpent, monthlyBudget = 0, onUpdateBudget, expenses = [] }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isBudgetSet = monthlyBudget > 0;
    const progress = isBudgetSet ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;
    const isOverLimit = progress >= 100;

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(monthlyBudget);

    const handleSave = () => {
        if (onUpdateBudget) onUpdateBudget(parseFloat(editValue) || 0);
        setIsEditing(false);
    };

    const currentDay = new Date().getDate();

    // Compute wallet breakdown from expenses
    const walletTotals = expenses.reduce((acc, exp) => {
        acc[exp.wallet] = (acc[exp.wallet] || 0) + parseFloat(exp.amount);
        return acc;
    }, {});
    const cashTotal = walletTotals['Cash'] || 0;
    const digitalTotal = (walletTotals['UPI'] || 0) + (walletTotals['Card'] || 0) + (walletTotals['Bank'] || 0);

    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, var(--primary) 0%, #cc4400 100%)',
            color: '#fff',
            borderRadius: '1.25rem',
            padding: isMobile ? '1.5rem' : '1rem 1.5rem',
            boxShadow: '0 10px 15px -3px rgba(255,102,0,0.25), 0 4px 6px -2px rgba(255,102,0,0.1)',
            width: isMobile ? '100%' : '500px',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: isMobile ? '1rem' : '0.6rem'
        }}>
            {/* Decorative background circles */}
            <div style={{ position:'absolute', top:'-20%', right:'-8%', width:'220px', height:'220px', borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.08)', zIndex:0, pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:'-35%', left:'-8%', width:'180px', height:'180px', borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.05)', zIndex:0, pointerEvents:'none' }} />

            {/* Top Section */}
            <div style={{ position:'relative', zIndex:1 }}>
                {/* Header row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <p style={{ fontSize:'0.72rem', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.85, margin:0 }}>
                        This Month's Spend
                    </p>
                    {!isEditing && (
                        <button onClick={() => { setEditValue(monthlyBudget); setIsEditing(true); }} title="Edit Budget"
                            style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', padding:'0.35rem', borderRadius:'50%' }}>
                            <Edit2 size={13} />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginTop:'0.75rem' }}>
                        <span style={{ fontSize:'1.5rem', fontWeight:'bold' }}>₹</span>
                        <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                            style={{ flex:1, padding:'0.5rem', borderRadius:'0.5rem', backgroundColor:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', fontWeight:'bold', outline:'none' }}
                            autoFocus />
                        <button onClick={handleSave} style={{ background:'#fff', color:'#cc4400', border:'none', padding:'0.5rem', borderRadius:'0.5rem', cursor:'pointer' }}><Check size={16} /></button>
                        <button onClick={() => setIsEditing(false)} style={{ background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', padding:'0.5rem', borderRadius:'0.5rem', cursor:'pointer' }}><X size={16} /></button>
                    </div>
                ) : (
                    <>
                        {/* Amount and Wallet Pills Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isMobile ? '0.35rem' : '0.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                            {/* Big Amount */}
                            <p style={{ fontSize: isMobile ? '3rem' : '2rem', fontWeight:900, lineHeight:1.05, margin: 0, letterSpacing:'-0.03em' }}>
                                ₹{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>

                            {/* Wallet Breakdown Pills */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isMobile ? '0.6rem' : '0.4rem',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.3rem 0.75rem', borderRadius:'0.5rem', backgroundColor:'rgba(255,255,255,0.15)', fontSize:'0.75rem', fontWeight:600 }}>
                                    <Wallet size={12} />
                                    <span>Cash</span>
                                    <span style={{ opacity:0.8 }}>₹{cashTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.3rem 0.75rem', borderRadius:'0.5rem', backgroundColor:'rgba(255,255,255,0.15)', fontSize:'0.75rem', fontWeight:600 }}>
                                    <CreditCard size={12} />
                                    <span>Digital</span>
                                    <span style={{ opacity:0.8 }}>₹{digitalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status row */}
                        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '0.75rem' : '0.5rem', marginTop: isMobile ? '0.6rem' : '0.4rem', flexWrap: 'wrap' }}>
                            {isOverLimit ? (
                                <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.85rem', fontWeight:600 }}>
                                    <AlertTriangle size={15} strokeWidth={2.5} /><span>Over Budget</span>
                                </div>
                            ) : (
                                <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.85rem', fontWeight:600 }}>
                                    <TrendingUp size={15} strokeWidth={2.5} /><span>Stable spending</span>
                                </div>
                            )}
                            <div style={{ display:'flex', alignItems:'center', gap:'0.2rem', padding:'0.2rem 0.6rem', borderRadius:'0.5rem', backgroundColor:'rgba(255,255,255,0.2)', fontSize:'0.72rem', fontWeight:700 }}>
                                🔥 {currentDay}d
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom: Budget Progress Bar */}
            {!isEditing && (
                <div style={{ position:'relative', zIndex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', fontWeight:700, marginBottom: isMobile ? '0.5rem' : '0.35rem', opacity:0.95 }}>
                        <span>Budget used</span>
                        {isBudgetSet
                            ? <span>{progress.toFixed(0)}% of ₹{monthlyBudget.toLocaleString()}</span>
                            : <span style={{ opacity:0.7, cursor:'pointer' }} onClick={() => { setEditValue(0); setIsEditing(true); }}>Set a budget →</span>
                        }
                    </div>
                    <div style={{ height:'7px', backgroundColor:'rgba(255,255,255,0.2)', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progress}%`, background: isOverLimit ? '#ff4444' : '#fff', borderRadius:'4px', transition:'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                </div>
            )}
        </div>
    );
}
