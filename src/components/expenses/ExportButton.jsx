import { useState, useMemo } from 'react';
import { Download, FileText, Share2, ChevronDown } from 'lucide-react';

const RANGES = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'last3Months', label: 'Last 3 Months' },
];

function getDateRange(key) {
    const now = new Date();
    switch (key) {
        case 'thisMonth': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { start, end, label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
        }
        case 'lastMonth': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start, end, label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
        }
        case 'last3Months': {
            const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const end = now;
            return { start, end, label: 'Last 3 Months' };
        }
        default:
            return { start: new Date(0), end: now, label: 'All Time' };
    }
}

export default function ExportButton({ expenses = [], budget = 0 }) {
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState('thisMonth');

    const { start, end, label } = useMemo(() => getDateRange(range), [range]);

    const filtered = useMemo(() => expenses.filter(e => {
        const d = new Date(e.date || e.created_at);
        return d >= start && d <= end;
    }), [expenses, start, end]);

    const total = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    const downloadCSV = () => {
        const header = ['Date', 'Description', 'Category', 'Wallet', 'Amount', 'Notes'].join(',');
        const summary = [
            `# StudentHub Expense Report`,
            `# Period: ${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            `# Total Spent: ₹${Math.round(total).toLocaleString('en-IN')} | Budget: ₹${budget.toLocaleString('en-IN')} | Saved: ₹${Math.max(0, Math.round(budget - total)).toLocaleString('en-IN')}`,
            `# Transactions: ${filtered.length}`,
            '',
        ].join('\n');

        const rows = filtered.map(e => {
            const desc = (e.description || '').split(' | Note: ')[0].replace(/,/g, ' ');
            const note = (e.description || '').split(' | Note: ')[1] || '';
            return [
                new Date(e.date || e.created_at).toLocaleDateString('en-IN'),
                `"${desc}"`,
                e.category || '',
                e.wallet || '',
                parseFloat(e.amount || 0).toFixed(2),
                `"${note}"`,
            ].join(',');
        });

        const csv = summary + header + '\n' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const monthSlug = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase().replace(' ', '_');
        a.href = url;
        a.download = `studenthub_expenses_${monthSlug}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
    };

    const downloadPDF = () => {
        // Create hidden print template
        const template = document.getElementById('export-print-template');
        if (template) {
            template.style.display = 'block';
            window.print();
            template.style.display = 'none';
        }
        setOpen(false);
    };

    const shareText = () => {
        const catTotals = {};
        filtered.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount || 0); });
        const cats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, v]) => `• ${c}: ₹${Math.round(v).toLocaleString('en-IN')}`).join('\n');
        const text = `📊 My StudentHub Expense Summary — ${label}\n\nTotal Spent: ₹${Math.round(total).toLocaleString('en-IN')}\nBudget: ₹${budget.toLocaleString('en-IN')}\nSaved: ₹${Math.max(0, Math.round(budget - total)).toLocaleString('en-IN')}\n\nTop Categories:\n${cats}\n\nTracked with StudentHub 🎓`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Summary copied to clipboard! 📋 Paste it anywhere.');
        }).catch(() => alert(text));
        setOpen(false);
    };

    return (
        <>
            {/* Hidden print template */}
            <div id="export-print-template" style={{ display: 'none' }}>
                <div style={{ fontFamily: 'Arial, sans-serif', padding: '2cm', color: '#000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ff6600', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ margin: 0, color: '#ff6600', fontSize: '1.5rem' }}>🎓 StudentHub</h1>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>Expense Report</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
                            <div>{label}</div>
                            <div>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                        <tbody>
                            <tr>
                                {[['Total Spent', `₹${Math.round(total).toLocaleString('en-IN')}`], ['Budget', `₹${budget.toLocaleString('en-IN')}`], ['Saved', `₹${Math.max(0, Math.round(budget - total)).toLocaleString('en-IN')}`], ['Transactions', filtered.length]].map(([k, v]) => (
                                    <td key={k} style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{k}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6600' }}>{v}</div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                            <tr style={{ background: '#f8f8f8' }}>
                                {['Date', 'Description', 'Category', 'Wallet', 'Amount'].map(h => (
                                    <th key={h} style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #ddd', textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(e => (
                                <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.4rem 0.75rem' }}>{new Date(e.date || e.created_at).toLocaleDateString('en-IN')}</td>
                                    <td style={{ padding: '0.4rem 0.75rem' }}>{(e.description || '').split(' | Note: ')[0]}</td>
                                    <td style={{ padding: '0.4rem 0.75rem' }}>{e.category}</td>
                                    <td style={{ padding: '0.4rem 0.75rem' }}>{e.wallet}</td>
                                    <td style={{ padding: '0.4rem 0.75rem', fontWeight: 'bold' }}>₹{parseFloat(e.amount || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#999', textAlign: 'center' }}>
                        Generated by StudentHub Expense Tracker on {new Date().toLocaleDateString('en-IN')}
                    </div>
                </div>
            </div>

            <style>{`@media print { body > *:not(#export-print-template) { display: none !important; } #export-print-template { display: block !important; } }`}</style>

            <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 0 }}>
                    {/* Range selector */}
                    <select
                        value={range}
                        onChange={e => setRange(e.target.value)}
                        aria-label="Export date range"
                        style={{ padding: '0.45rem 0.75rem', borderRadius: '0.5rem 0 0 0.5rem', border: '1px solid var(--border)', borderRight: 'none', background: 'var(--input-bg)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                        {RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    
                    <button
                        onClick={() => setOpen(!open)}
                        aria-label="Export options"
                        aria-expanded={open}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.875rem', borderRadius: '0 0.5rem 0.5rem 0', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        <Download size={14} /> Export <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                    </button>
                </div>

                {open && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: '0.75rem', padding: '0.4rem', minWidth: '180px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100,
                        animation: 'fadeInUp 0.15s ease',
                    }}>
                        {[
                            { icon: <FileText size={14} />, label: 'Download CSV', action: downloadCSV },
                            { icon: <FileText size={14} />, label: 'Download PDF', action: downloadPDF },
                            { icon: <Share2 size={14} />, label: 'Share Summary', action: shareText },
                        ].map(item => (
                            <button
                                key={item.label}
                                onClick={item.action}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.5rem', border: 'none', background: 'transparent', color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
