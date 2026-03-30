import { useState } from 'react';
import { useMediaQuery } from '../../utils/useMediaQuery';

export default function DashboardPanels({ settings, subscriptions, savingsGoals, onAddSubscription }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [autoCategorize, setAutoCategorize] = useState(settings?.auto_categorize || false);
    
    // Subscription form state
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [subForm, setSubForm] = useState({ service_name: '', cost_per_month: '' });

    const handleSubSubmit = (e) => {
        e.preventDefault();
        if (onAddSubscription) {
            onAddSubscription({
                service_name: subForm.service_name,
                cost_per_month: parseFloat(subForm.cost_per_month)
            });
            setIsAddingSub(false);
            setSubForm({ service_name: '', cost_per_month: '' });
        }
    };

    const topGoal = savingsGoals && savingsGoals.length > 0 ? savingsGoals[0] : null;

    const panelStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: isMobile ? '1.5rem' : '1rem',
        flex: '1',
        minWidth: '250px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    };

    return (
        <div style={{ display: 'flex', gap: isMobile ? '1.5rem' : '1rem', flexWrap: 'wrap', marginBottom: isMobile ? '2rem' : '1rem' }}>
            
            {/* 1) Auto-Categorization Panel */}
            <div style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1.5rem' : '1rem' }}>
                    <h3 style={{ fontSize: isMobile ? '1.1rem' : '1rem' }}>1) Auto-Categorization</h3>
                    {/* Fake Toggle Switch */}
                    <div 
                        onClick={() => setAutoCategorize(!autoCategorize)}
                        style={{
                            width: '40px', height: '24px', borderRadius: '12px',
                            backgroundColor: autoCategorize ? 'var(--primary)' : 'var(--input-bg)',
                            position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                    >
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            backgroundColor: '#fff', position: 'absolute', top: '2px',
                            left: autoCategorize ? '18px' : '2px', transition: 'all 0.3s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }} />
                    </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Automatically categorize new transactions.
                </p>
            </div>

            {/* 2) Subscription Manager */}
            <div style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1.5rem' : '1rem' }}>
                    <h3 style={{ fontSize: isMobile ? '1.1rem' : '1rem' }}>2) Subscription Manager</h3>
                    <button onClick={() => setIsAddingSub(!isAddingSub)} style={{ 
                        backgroundColor: isAddingSub ? 'var(--surface)' : 'var(--primary)', 
                        border: isAddingSub ? '1px solid var(--border)' : 'none', 
                        color: isAddingSub ? 'var(--text)' : '#fff', 
                        padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' 
                    }}>{isAddingSub ? 'Cancel' : 'Add Subscription'}</button>
                </div>
                
                {isAddingSub && (
                    <form onSubmit={handleSubSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input required type="text" placeholder="Service (e.g. Netflix)" value={subForm.service_name} onChange={e=>setSubForm({...subForm, service_name: e.target.value})} style={{ flex: 2, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.75rem' }} />
                        <input required type="number" placeholder="₹/mo" value={subForm.cost_per_month} onChange={e=>setSubForm({...subForm, cost_per_month: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.75rem' }} />
                        <button type="submit" style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>Add</button>
                    </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '100px', overflowY: 'auto' }}>
                    {subscriptions && subscriptions.length > 0 ? subscriptions.map(sub => (
                        <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem' }}>{sub.service_name}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>₹{parseFloat(sub.cost_per_month).toFixed(0)}/mo</span>
                        </div>
                    )) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>No active subscriptions</div>
                    )}
                </div>
            </div>

            {/* 3) Savings Goal */}
            <div style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1.5rem' : '1rem' }}>
                    <h3 style={{ fontSize: isMobile ? '1.1rem' : '1rem' }}>3) Savings Goal</h3>
                    <button style={{ 
                        backgroundColor: 'var(--primary)', border: 'none', color: '#fff', 
                        padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' 
                    }}>Deposit</button>
                </div>

                {topGoal ? (() => {
                    const prog = Math.min((topGoal.saved_amount / topGoal.target_amount) * 100, 100);
                    return (
                        <>
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Goal: <strong>{topGoal.goal_name} (₹{parseFloat(topGoal.target_amount).toFixed(0)})</strong> - Saved: <strong>₹{parseFloat(topGoal.saved_amount).toFixed(0)}</strong> ({prog.toFixed(0)}%)
                            </p>
                            <div style={{ height: '12px', backgroundColor: 'var(--input-bg)', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${prog}%`, backgroundColor: 'var(--primary)' }}></div>
                            </div>
                        </>
                    );
                })() : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>No active goals</div>
                )}
            </div>
            
        </div>
    );
}
