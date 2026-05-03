import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const FIXED_COSTS = [
    { key: 'rent', label: 'Rent/PG' },
    { key: 'phone', label: 'Phone Bill' },
    { key: 'internet', label: 'Internet' },
    { key: 'fees', label: 'College Fees' },
    { key: 'transport_pass', label: 'Transport Pass' },
];

const CATEGORY_NEED = ['Food & Dining', 'Healthcare', 'Utilities'];
const CATEGORY_WANT = ['Entertainment', 'Shopping', 'Personal Care'];

const STEP_LABELS = ['Income', 'Fixed Costs', 'Goals'];

export default function BudgetWizard({ isOpen, onClose, onComplete }) {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1=forward, -1=back

    // Step 1
    const [income, setIncome] = useState('');
    const [frequency, setFrequency] = useState('monthly');

    // Step 2
    const [fixedCosts, setFixedCosts] = useState({});
    const [fixedEnabled, setFixedEnabled] = useState({});

    // Step 3
    const [savingsRate, setSavingsRate] = useState(20);
    const [priority, setPriority] = useState('Save for goal');

    // Budgets (editable)
    const [budgets, setBudgets] = useState({});
    const [saving, setSaving] = useState(false);

    const firstInputRef = useRef(null);

    // Auto-focus first input on step change
    useEffect(() => {
        if (isOpen && firstInputRef.current) {
            setTimeout(() => firstInputRef.current?.focus(), 200);
        }
    }, [step, isOpen]);

    if (!isOpen) return null;

    const monthlyIncome = frequency === 'weekly' ? parseFloat(income || 0) * 4.3
        : frequency === 'biweekly' ? parseFloat(income || 0) * 2
        : parseFloat(income || 0);

    const totalFixed = Object.entries(fixedEnabled)
        .filter(([, v]) => v)
        .reduce((s, [k]) => s + parseFloat(fixedCosts[k] || 0), 0);

    const disposable = Math.max(monthlyIncome - totalFixed, 0);
    const savings = disposable * (savingsRate / 100);
    const spendable = disposable - savings;

    // 50/30/20 allocation
    const calcBudgets = () => {
        const needs = spendable * 0.5;
        const wants = spendable * 0.3;
        return {
            'Food & Dining': Math.round(needs * 0.6),
            'Healthcare': Math.round(needs * 0.2),
            'Utilities': Math.round(needs * 0.2),
            'Entertainment': Math.round(wants * 0.4),
            'Shopping': Math.round(wants * 0.4),
            'Personal Care': Math.round(wants * 0.2),
            'Transportation': Math.round(spendable * 0.15),
            'Other': Math.round(spendable * 0.05),
        };
    };

    const goNext = () => {
        if (step === 2) {
            // generate budgets before showing step 3 summary
            setBudgets(calcBudgets());
        }
        setDirection(1);
        setStep(s => Math.min(s + 1, 3));
    };

    const goBack = () => {
        setDirection(-1);
        setStep(s => Math.max(s - 1, 0));
    };

    const handleApply = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // Save monthly budget total to expense_settings
            const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
            await supabase.from('expense_settings')
                .upsert({ user_id: user.id, monthly_budget: totalBudget })
                .select().single();

            localStorage.setItem('wizard_completed', 'true');
            if (onComplete) onComplete(totalBudget);
            onClose();
        } catch (err) {
            console.error('Error applying budgets:', err);
        } finally {
            setSaving(false);
        }
    };

    const overlayStyle = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    };

    const modalStyle = {
        background: 'var(--surface)', borderRadius: '1.25rem',
        border: '1px solid var(--border)', padding: '1.75rem',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        maxHeight: '90vh', overflowY: 'auto',
    };

    return (
        <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Budget Wizard">
            <div style={modalStyle}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                            💰 Smart Budget Wizard
                        </h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                            Step {Math.min(step + 1, 3)} of 3 — {STEP_LABELS[Math.min(step, 2)]}
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Close wizard" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                        ×
                    </button>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    {STEP_LABELS.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= Math.min(step, 2) ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s ease' }} />
                    ))}
                </div>

                {/* ── Step 0: Income ── */}
                {step === 0 && (
                    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            What's your monthly income/allowance?
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.4rem', color: 'var(--text-secondary)' }}>₹</span>
                            <input
                                ref={firstInputRef}
                                type="number"
                                value={income}
                                onChange={e => setIncome(e.target.value)}
                                placeholder="e.g. 10000"
                                aria-label="Monthly income in rupees"
                                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.625rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700 }}
                            />
                        </div>

                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            How often do you receive it?
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['weekly', 'biweekly', 'monthly'].map(f => (
                                <button key={f} onClick={() => setFrequency(f)} aria-pressed={frequency === f}
                                    style={{ flex: 1, padding: '0.6rem', borderRadius: '0.625rem', border: `1px solid ${frequency === f ? 'var(--primary)' : 'var(--border)'}`, background: frequency === f ? 'rgba(255,102,0,0.15)' : 'var(--input-bg)', color: frequency === f ? 'var(--primary)' : 'var(--text)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        {income && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,102,0,0.08)', borderRadius: '0.625rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Monthly equivalent: <strong style={{ color: 'var(--primary)' }}>₹{Math.round(monthlyIncome).toLocaleString('en-IN')}</strong>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 1: Fixed Costs ── */}
                {step === 1 && (
                    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                            Toggle your regular fixed expenses and enter the amounts:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                            {FIXED_COSTS.map(({ key, label }) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: '0.625rem', border: `1px solid ${fixedEnabled[key] ? 'var(--primary)' : 'var(--border)'}`, background: fixedEnabled[key] ? 'rgba(255,102,0,0.07)' : 'var(--input-bg)', transition: 'all 0.2s' }}>
                                    <div onClick={() => setFixedEnabled(p => ({ ...p, [key]: !p[key] }))} style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${fixedEnabled[key] ? 'var(--primary)' : 'var(--border)'}`, background: fixedEnabled[key] ? 'var(--primary)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {fixedEnabled[key] && <Check size={12} color="#fff" />}
                                    </div>
                                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
                                    {fixedEnabled[key] && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>₹</span>
                                            <input
                                                ref={key === 'rent' ? firstInputRef : null}
                                                type="number"
                                                value={fixedCosts[key] || ''}
                                                onChange={e => setFixedCosts(p => ({ ...p, [key]: e.target.value }))}
                                                placeholder="0"
                                                aria-label={`${label} monthly amount`}
                                                style={{ width: '90px', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '0.75rem', background: 'var(--input-bg)', borderRadius: '0.625rem', fontSize: '0.82rem' }}>
                            Fixed costs: <strong>₹{Math.round(totalFixed).toLocaleString('en-IN')}</strong>
                            {monthlyIncome > 0 && <span style={{ color: 'var(--text-secondary)' }}> ({Math.round(totalFixed / monthlyIncome * 100)}% of income)</span>}
                        </div>
                    </div>
                )}

                {/* ── Step 2: Goals ── */}
                {step === 2 && (
                    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            How much do you want to save monthly?
                        </label>
                        <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800 }}>{savingsRate}%</span> of ₹{Math.round(disposable).toLocaleString('en-IN')} disposable = <strong style={{ color: 'var(--primary)' }}>₹{Math.round(savings).toLocaleString('en-IN')}/mo</strong>
                        </div>
                        <input
                            ref={firstInputRef}
                            type="range" min="0" max="40" value={savingsRate}
                            onChange={e => setSavingsRate(Number(e.target.value))}
                            aria-label="Savings rate percentage"
                            className="attendance-slider"
                            style={{ width: '100%', accentColor: 'var(--primary)', background: `linear-gradient(to right, var(--primary) ${savingsRate / 40 * 100}%, var(--border) 0%)`, height: '4px', borderRadius: '3px', border: 'none', padding: 0, marginBottom: '1rem' }}
                        />

                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            What's your #1 financial priority?
                        </label>
                        <select value={priority} onChange={e => setPriority(e.target.value)} aria-label="Financial priority" style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.625rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {['Save for goal', 'Reduce debt', 'Build emergency fund', 'No specific goal'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>

                        <div style={{ padding: '0.75rem', background: 'var(--input-bg)', borderRadius: '0.625rem', fontSize: '0.82rem' }}>
                            Spendable budget: <strong style={{ color: 'var(--primary)' }}>₹{Math.round(spendable).toLocaleString('en-IN')}/mo</strong>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Review & Apply ── */}
                {step === 3 && (
                    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.875rem' }}>
                            Review your recommended budget allocation. You can edit any amount — they're just guidelines!
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                            {Object.entries(budgets).map(([cat, amt]) => (
                                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600 }}>{cat}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                                    <input
                                        type="number"
                                        value={budgets[cat]}
                                        onChange={e => setBudgets(p => ({ ...p, [cat]: parseInt(e.target.value) || 0 }))}
                                        aria-label={`Budget for ${cat}`}
                                        style={{ width: '90px', padding: '0.3rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.82rem', fontWeight: 700, textAlign: 'right' }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '0.75rem', background: 'rgba(255,102,0,0.08)', borderRadius: '0.625rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
                            Total: <strong style={{ color: 'var(--primary)' }}>₹{Object.values(budgets).reduce((s, v) => s + v, 0).toLocaleString('en-IN')}/mo</strong>
                            {' '}<span style={{ color: 'var(--text-secondary)' }}>+ ₹{Math.round(savings).toLocaleString('en-IN')} savings</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    {step > 0 && (
                        <button onClick={goBack} aria-label="Previous step" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '0.625rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            <ChevronLeft size={16} /> Back
                        </button>
                    )}
                    {step < 3 ? (
                        <button onClick={goNext} disabled={step === 0 && !income} aria-label="Next step"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '0.625rem', border: 'none', background: 'linear-gradient(135deg, var(--primary), #cc4400)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: step === 0 && !income ? 0.5 : 1 }}>
                            {step === 2 ? 'Generate Budget' : 'Next'} <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button onClick={handleApply} disabled={saving} aria-label="Apply budgets"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '0.625rem', border: 'none', background: 'linear-gradient(135deg, var(--primary), #cc4400)', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                            {saving ? 'Applying...' : '✅ Apply Budgets'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
