import { useState } from 'react';
import { AlertTriangle, Edit2, Check, X } from 'lucide-react';

export default function BudgetStatus({ totalSpent, monthlyBudget = 0, onUpdateBudget }) {
    const isBudgetSet = monthlyBudget > 0;
    const progress = isBudgetSet ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;
    const isNearingLimit = progress > 75;
    const isOverLimit = progress >= 100;

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(monthlyBudget);

    const handleSave = () => {
        if (onUpdateBudget) {
            onUpdateBudget(parseFloat(editValue) || 0);
        }
        setIsEditing(false);
    };

    return (
        <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            flex: '1',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Budget Status</h3>
                {!isEditing && (
                    <button 
                        onClick={() => { setEditValue(monthlyBudget); setIsEditing(true); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}
                    >
                        <Edit2 size={14} /> Edit Budget
                    </button>
                )}
            </div>
            
            {isEditing ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>₹</span>
                    <input 
                        type="number" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)} 
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--primary)' }}
                        autoFocus
                    />
                    <button onClick={handleSave} style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}><Check size={16} /></button>
                    <button onClick={() => setIsEditing(false)} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}><X size={16} /></button>
                </div>
            ) : null}

            {!isBudgetSet && !isEditing ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                    No monthly budget set. Click "Edit Budget" to set one.
                </div>
            ) : (!isEditing && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500' }}>Monthly Budget: ₹{monthlyBudget.toFixed(2)}</span>
                        {isNearingLimit && !isOverLimit && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                <AlertTriangle size={16} /> Nearing Limit
                            </span>
                        )}
                        {isOverLimit && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--error)', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                <AlertTriangle size={16} /> Over Budget
                            </span>
                        )}
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div style={{ height: '20px', backgroundColor: 'var(--input-bg)', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
                        {/* The Fill */}
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: isOverLimit ? 'var(--error)' : 'linear-gradient(90deg, var(--primary) 0%, var(--warning) 100%)',
                            borderRadius: '9999px',
                            transition: 'width 0.5s ease-out'
                        }}></div>
                        
                        {/* Percentage Label Inside */}
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: progress > 50 ? '#000' : 'var(--text)'
                        }}>
                            {progress.toFixed(0)}%
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <span>₹{totalSpent.toFixed(2)} Spent</span>
                        <span>₹{Math.max(monthlyBudget - totalSpent, 0).toFixed(2)} Left</span>
                    </div>
                </>
            ))}
        </div>
    );
}
