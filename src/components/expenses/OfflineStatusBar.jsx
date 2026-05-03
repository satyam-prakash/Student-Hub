import { useState, useEffect } from 'react';

export default function OfflineStatusBar({ isOnline, pendingCount, isSyncing }) {
    const [showSyncSuccess, setShowSyncSuccess] = useState(false);
    const [prevSyncing, setPrevSyncing] = useState(false);

    useEffect(() => {
        if (prevSyncing && !isSyncing && isOnline) {
            setShowSyncSuccess(true);
            const t = setTimeout(() => setShowSyncSuccess(false), 4000);
            return () => clearTimeout(t);
        }
        setPrevSyncing(isSyncing);
    }, [isSyncing, isOnline]);

    if (isOnline && !isSyncing && !showSyncSuccess && pendingCount === 0) return null;

    const barStyle = {
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        borderRadius: '2rem',
        padding: '0.6rem 1.25rem',
        fontSize: '0.8rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeInUp 0.3s ease',
        whiteSpace: 'nowrap',
    };

    if (!isOnline) {
        return (
            <div style={{ ...barStyle, background: 'rgba(51,51,51,0.9)', border: '1px solid #555', color: '#ccc' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#666', display: 'inline-block' }} />
                📡 Offline mode — changes will sync when reconnected
                {pendingCount > 0 && <span style={{ background: '#ff6600', color: '#fff', borderRadius: '1rem', padding: '0.1rem 0.5rem', fontSize: '0.72rem' }}>{pendingCount} pending</span>}
            </div>
        );
    }

    if (isSyncing || (pendingCount > 0 && isOnline)) {
        return (
            <div style={{ ...barStyle, background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb923c', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                ⏳ Syncing {pendingCount} transaction{pendingCount !== 1 ? 's' : ''}...
            </div>
        );
    }

    if (showSyncSuccess) {
        return (
            <div style={{ ...barStyle, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                ✅ Back online — all transactions synced!
            </div>
        );
    }

    return null;
}
