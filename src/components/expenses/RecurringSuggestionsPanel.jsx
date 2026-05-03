import { useState } from 'react';
import { detectRecurringTransactions } from '../../utils/analytics';
import { useMemo } from 'react';
import { RefreshCw, X, Plus } from 'lucide-react';

export default function RecurringSuggestionsPanel({ transactions, onAddSubscription }) {
    const [ignored, setIgnored] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('ignored_recurring') || '[]')); }
        catch { return new Set(); }
    });
    const [added, setAdded] = useState(new Set());

    const suggestions = useMemo(() => detectRecurringTransactions(transactions), [transactions]);
    const visible = suggestions.filter(s => !ignored.has(s.id) && !added.has(s.id));

    const handleIgnore = (id) => {
        const next = new Set(ignored);
        next.add(id);
        setIgnored(next);
        localStorage.setItem('ignored_recurring', JSON.stringify([...next]));
    };

    const handleAdd = (item) => {
        if (onAddSubscription) {
            onAddSubscription({
                service_name: item.description,
                cost_per_month: item.frequency === 'monthly' ? item.amount
                    : item.frequency === 'weekly' ? item.amount * 4.3
                    : item.frequency === 'biweekly' ? item.amount * 2
                    : item.amount,
            });
        }
        const next = new Set(added);
        next.add(item.id);
        setAdded(next);
    };

    if (visible.length === 0) return null;

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid rgba(139,92,246,0.3)',
        padding: '1rem 1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06), transparent 60%), var(--surface)',
    };

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <RefreshCw size={16} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Detected Recurring Payments</h3>
                <span style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderRadius: '1rem', padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    {visible.length} found
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {visible.map(item => (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.625rem 0.875rem', borderRadius: '0.625rem',
                        background: 'var(--input-bg)', border: '1px solid var(--border)',
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.description}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                ₹{item.amount.toFixed(0)} · {item.frequencyLabel} · {item.occurrences} occurrences
                            </div>
                        </div>

                        <button
                            onClick={() => handleAdd(item)}
                            aria-label={`Add ${item.description} to subscriptions`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                background: '#8b5cf6', color: '#fff', border: 'none',
                                borderRadius: '0.5rem', padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                        >
                            <Plus size={12} />
                            Add
                        </button>

                        <button
                            onClick={() => handleIgnore(item.id)}
                            aria-label="Not recurring — dismiss"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '0.625rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                💡 Based on patterns in your last 90 days of transactions
            </div>
        </div>
    );
}
