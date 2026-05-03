import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Trophy, Trash2, AlertCircle } from 'lucide-react';

const PRIORITY_CONFIG = {
    1: { label: 'Low', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
    2: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    3: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

function ConfettiLocal({ active }) {
    if (!active) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
            {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute', left: `${Math.random() * 100}%`, top: '-10px',
                    width: 8, height: 8, borderRadius: Math.random() > 0.5 ? '50%' : 0,
                    background: ['#ff6600','#22c55e','#3b82f6','#f59e0b'][i % 4],
                    animation: `confetti-fall ${1.5 + Math.random()}s ease-in ${Math.random() * 0.4}s forwards`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                }} />
            ))}
        </div>
    );
}

export default function WishlistPage({ currentSaveRate = 0 }) {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tableNotFound, setTableNotFound] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [confetti, setConfetti] = useState(false);
    const [form, setForm] = useState({ name: '', target_price: '', priority: 2, image_url: '' });
    const [dragOver, setDragOver] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('priority', { ascending: false })
                .order('created_at', { ascending: true });

            if (err) {
                // 42P01 = table doesn't exist (Postgres)
                if (err.code === '42P01' || err.message?.includes('does not exist') || err.message?.includes('404')) {
                    setTableNotFound(true);
                } else {
                    setError(err.message);
                }
            } else {
                setItems(data || []);
            }
        } catch (e) {
            setError('Failed to load wishlist. Your data is safe — we\'ll retry.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { load(); }, [load]);

    const addItem = async (e) => {
        e.preventDefault();
        if (!user || !form.name || !form.target_price) return;
        setSaving(true);
        try {
            const { data, error: err } = await supabase.from('wishlist_items').insert([{
                user_id: user.id,
                name: form.name,
                target_price: parseFloat(form.target_price),
                priority: form.priority,
                image_url: form.image_url || null,
                status: 'active',
            }]).select().single();

            if (err) {
                if (err.code === '42P01') setTableNotFound(true);
                else setError(err.message);
            } else if (data) {
                setItems(prev => [...prev, data]);
                setForm({ name: '', target_price: '', priority: 2, image_url: '' });
                setShowForm(false);
            }
        } catch (e) {
            setError('Failed to add item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const markPurchased = async (item) => {
        const { error: err } = await supabase
            .from('wishlist_items')
            .update({ status: 'purchased' })
            .eq('id', item.id);
        if (!err) {
            setItems(prev => prev.filter(i => i.id !== item.id));
            setConfetti(true);
            setTimeout(() => setConfetti(false), 3000);
        }
    };

    const deleteItem = async (id) => {
        const { error: err } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('id', id);
        if (!err) setItems(prev => prev.filter(i => i.id !== id));
    };

    // Drag-and-drop reordering
    const handleDragStart = (e, idx) => { e.dataTransfer.setData('text/plain', String(idx)); };
    const handleDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx); };
    const handleDrop = (e, dropIdx) => {
        e.preventDefault();
        const dragIdx = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIdx === dropIdx) { setDragOver(null); return; }
        const reordered = [...items];
        const [moved] = reordered.splice(dragIdx, 1);
        reordered.splice(dropIdx, 0, moved);
        setItems(reordered);
        setDragOver(null);
    };

    const calcTimeline = (targetPrice) => {
        if (!currentSaveRate || currentSaveRate <= 0 || !targetPrice) return null;
        const months = Math.ceil(targetPrice / currentSaveRate);
        if (months <= 1) return 'Less than a month away! 🎉';
        if (months < 12) return `~${months} months at your current save rate`;
        return `~${(months / 12).toFixed(1)} years at your current save rate`;
    };

    // ── Table not set up yet ──
    if (tableNotFound) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800 }}>Wishlist</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Save up for things you want
                        </p>
                    </div>
                </div>

                <div style={{
                    padding: '2rem',
                    borderRadius: '1rem',
                    border: '1px dashed var(--border)',
                    background: 'var(--surface)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗄️</div>
                    <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>One-time database setup needed</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                        Run the SQL below in your Supabase dashboard to enable the Wishlist feature.
                    </p>

                    <div style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        textAlign: 'left',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginBottom: '1rem',
                    }}>
                        <div style={{ color: '#22c55e' }}>-- Run this in Supabase SQL Editor:</div>
                        <div style={{ marginTop: '0.5rem' }}>
                            {`CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  priority INTEGER DEFAULT 2,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_wishlist" ON public.wishlist_items
  FOR ALL USING (auth.uid() = user_id);`}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                            href="https://supabase.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.6rem 1.25rem', borderRadius: '0.625rem',
                                background: 'linear-gradient(135deg, var(--primary), #cc4400)',
                                color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                            }}
                        >
                            Open Supabase Dashboard →
                        </a>
                        <button
                            onClick={load}
                            style={{
                                padding: '0.6rem 1.25rem', borderRadius: '0.625rem',
                                border: '1px solid var(--border)', background: 'var(--input-bg)',
                                color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                            }}
                        >
                            ↻ Done, retry
                        </button>
                    </div>

                    <p style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        💡 Full SQL is also available in <code>supabase_advanced_features.sql</code> in your project root.
                    </p>
                </div>
            </div>
        );
    }

    const cardBase = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        backdropFilter: 'blur(12px)',
    };

    return (
        <>
            <style>{`
                @keyframes confetti-fall {
                    from { transform: translateY(0) rotate(0deg); opacity: 1; }
                    to { transform: translateY(105vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
            <ConfettiLocal active={confetti} />

            <div style={{ paddingBottom: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800 }}>Wishlist</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {items.length > 0
                                ? `${items.length} item${items.length !== 1 ? 's' : ''} · Drag to reorder by priority`
                                : 'Track what you\'re saving up for'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        aria-label="Add wishlist item"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: '0.625rem', border: 'none', background: 'linear-gradient(135deg, var(--primary), #cc4400)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,102,0,0.3)' }}
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                {/* Error banner */}
                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
                        <AlertCircle size={16} color="#ef4444" />
                        <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{error}</span>
                        <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                    </div>
                )}

                {/* Add form */}
                {showForm && (
                    <form onSubmit={addItem} style={{
                        marginBottom: '1.25rem', padding: '1.25rem', borderRadius: '1rem',
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        animation: 'fadeInUp 0.3s ease',
                    }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>✨ New Wishlist Item</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Name *</label>
                                <input required type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. New Headphones" aria-label="Item name" style={{ padding: '0.65rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.85rem', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Price (₹) *</label>
                                <input required type="number" value={form.target_price} onChange={e => setForm(p => ({ ...p, target_price: e.target.value }))} placeholder="e.g. 2000" aria-label="Target price" style={{ padding: '0.65rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.85rem', width: '100%' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {[1, 2, 3].map(p => (
                                        <button type="button" key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))} aria-pressed={form.priority === p}
                                            style={{ flex: 1, padding: '0.45rem', borderRadius: '0.4rem', border: `1px solid ${form.priority === p ? PRIORITY_CONFIG[p].color : 'var(--border)'}`, background: form.priority === p ? PRIORITY_CONFIG[p].bg : 'transparent', color: form.priority === p ? PRIORITY_CONFIG[p].color : 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                                            {PRIORITY_CONFIG[p].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image URL (optional)</label>
                                <input type="url" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." aria-label="Image URL" style={{ padding: '0.65rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.85rem', width: '100%' }} />
                            </div>
                        </div>

                        {form.target_price && currentSaveRate > 0 && (
                            <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(255,102,0,0.08)', borderRadius: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                💡 At your current save rate: <strong style={{ color: 'var(--primary)' }}>{calcTimeline(parseFloat(form.target_price))}</strong>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, var(--primary), #cc4400)', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                                {saving ? 'Adding...' : '＋ Add to Wishlist'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Content */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ ...cardBase, height: 220, background: 'var(--surface)', animation: 'pulse 1.5s ease infinite' }}>
                                <div style={{ width: '100%', height: 80, background: 'var(--input-bg)' }} />
                                <div style={{ padding: '0.875rem' }}>
                                    <div style={{ height: 20, width: '70%', background: 'var(--input-bg)', borderRadius: 4, marginBottom: '0.5rem' }} />
                                    <div style={{ height: 28, width: '40%', background: 'var(--input-bg)', borderRadius: 4, marginBottom: '0.5rem' }} />
                                    <div style={{ height: 14, width: '90%', background: 'var(--input-bg)', borderRadius: 4 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>⭐</div>
                        <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Your wishlist is empty</h3>
                        <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto 1.25rem' }}>
                            Add items you're saving up for — we'll tell you exactly how long it'll take to reach them!
                        </p>
                        <button onClick={() => setShowForm(true)} style={{ padding: '0.65rem 1.5rem', borderRadius: '0.625rem', border: 'none', background: 'linear-gradient(135deg, var(--primary), #cc4400)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                            Add Your First Item
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {items.map((item, idx) => {
                            const pCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG[2];
                            const timeline = calcTimeline(item.target_price);
                            const addedDaysAgo = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000);

                            return (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={e => handleDragStart(e, idx)}
                                    onDragOver={e => handleDragOver(e, idx)}
                                    onDrop={e => handleDrop(e, idx)}
                                    onDragLeave={() => setDragOver(null)}
                                    style={{
                                        ...cardBase,
                                        border: dragOver === idx ? '2px dashed var(--primary)' : '1px solid var(--border)',
                                        transform: dragOver === idx ? 'scale(1.02)' : 'scale(1)',
                                        cursor: 'grab',
                                    }}
                                    aria-label={`Wishlist item: ${item.name}`}
                                >
                                    {/* Image or emoji placeholder */}
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                    ) : null}
                                    <div style={{ width: '100%', height: '80px', background: 'linear-gradient(135deg, rgba(255,102,0,0.12), rgba(255,102,0,0.04))', display: item.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                                        🛍️
                                    </div>

                                    <div style={{ padding: '0.875rem' }}>
                                        {/* Name + priority */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', gap: '0.5rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                            <span style={{ background: pCfg.bg, color: pCfg.color, borderRadius: '0.375rem', padding: '0.15rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                                                {pCfg.label}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.4rem', lineHeight: 1 }}>
                                            ₹{parseFloat(item.target_price).toLocaleString('en-IN')}
                                        </div>

                                        {/* Timeline */}
                                        {timeline && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--input-bg)', borderRadius: '0.375rem', padding: '0.3rem 0.5rem', marginBottom: '0.5rem', borderLeft: '2px solid var(--primary)' }}>
                                                💡 {timeline}
                                            </div>
                                        )}

                                        {/* Added ago */}
                                        {addedDaysAgo > 0 && (
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                                                Added {addedDaysAgo} day{addedDaysAgo !== 1 ? 's' : ''} ago
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button
                                                onClick={() => markPurchased(item)}
                                                aria-label={`Mark ${item.name} as purchased`}
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                <Trophy size={12} /> Purchased! 🎉
                                            </button>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                aria-label={`Delete ${item.name} from wishlist`}
                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
