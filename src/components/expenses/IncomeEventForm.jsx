import { useState } from 'react';
import { Plus, X, Calendar, DollarSign, RefreshCw } from 'lucide-react';

const COMMON_SOURCES = [
    'Pocket Money',
    'Part-time Job',
    'Scholarship',
    'Freelance',
    'Gift/Family Support',
    'Other',
];

export default function IncomeEventForm({ onAddEvent, onClose }) {
    const [form, setForm] = useState({
        amount: '',
        source: 'Pocket Money',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        recurring_day_of_month: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onAddEvent({
                amount: parseFloat(form.amount),
                source: form.source,
                date: form.date,
                is_recurring: form.is_recurring,
                recurring_day_of_month: form.is_recurring && form.recurring_day_of_month
                    ? parseInt(form.recurring_day_of_month)
                    : null,
            });
            
            // Reset form
            setForm({
                amount: '',
                source: 'Pocket Money',
                date: new Date().toISOString().split('T')[0],
                is_recurring: false,
                recurring_day_of_month: '',
            });
            
            if (onClose) onClose();
        } catch (err) {
            setError(err.message || 'Failed to add income event');
        } finally {
            setSaving(false);
        }
    };

    const formStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        marginBottom: '0.4rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    const inputStyle = {
        width: '100%',
        padding: '0.65rem 0.875rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        background: 'var(--input-bg)',
        color: 'var(--text)',
        fontSize: '0.85rem',
        fontFamily: 'inherit',
    };

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.65rem 1.25rem',
        borderRadius: '0.625rem',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 700,
        transition: 'all 0.2s ease',
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Add Income Event</h3>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close form"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '0.25rem',
                        }}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {error && (
                <div
                    role="alert"
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444',
                        fontSize: '0.82rem',
                        marginBottom: '1rem',
                    }}
                >
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Amount */}
                <div>
                    <label htmlFor="income-amount" style={labelStyle}>
                        Amount (₹) *
                    </label>
                    <input
                        id="income-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                        placeholder="e.g., 5000"
                        style={inputStyle}
                        disabled={saving}
                    />
                </div>

                {/* Date */}
                <div>
                    <label htmlFor="income-date" style={labelStyle}>
                        Date *
                    </label>
                    <input
                        id="income-date"
                        type="date"
                        required
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                        style={inputStyle}
                        disabled={saving}
                    />
                </div>
            </div>

            {/* Source */}
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="income-source" style={labelStyle}>
                    Source *
                </label>
                <select
                    id="income-source"
                    value={form.source}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                    style={inputStyle}
                    disabled={saving}
                >
                    {COMMON_SOURCES.map((source) => (
                        <option key={source} value={source}>
                            {source}
                        </option>
                    ))}
                </select>
            </div>

            {/* Recurring toggle */}
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={form.is_recurring}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                is_recurring: e.target.checked,
                                recurring_day_of_month: e.target.checked ? new Date(p.date).getDate().toString() : '',
                            }))
                        }
                        disabled={saving}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                        This is a recurring income (e.g., monthly salary, allowance)
                    </span>
                </label>
            </div>

            {/* Recurring day */}
            {form.is_recurring && (
                <div style={{ marginBottom: '1rem', animation: 'fadeInUp 0.2s ease' }}>
                    <label htmlFor="recurring-day" style={labelStyle}>
                        <RefreshCw size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Recurring Day of Month
                    </label>
                    <input
                        id="recurring-day"
                        type="number"
                        min="1"
                        max="31"
                        value={form.recurring_day_of_month}
                        onChange={(e) => setForm((p) => ({ ...p, recurring_day_of_month: e.target.value }))}
                        placeholder="e.g., 1 for 1st of month"
                        style={inputStyle}
                        disabled={saving}
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                        💡 Tip: Choose the day you typically receive this income
                    </div>
                </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            ...buttonStyle,
                            background: 'var(--input-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    aria-label="Add income event"
                    style={{
                        ...buttonStyle,
                        background: saving ? 'var(--border)' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        opacity: saving ? 0.6 : 1,
                    }}
                >
                    <Plus size={16} />
                    {saving ? 'Adding...' : 'Add Income'}
                </button>
            </div>
        </form>
    );
}
