import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ────────────────────────────────────────────
// IndexedDB helpers for offline queue
// ────────────────────────────────────────────
const DB_NAME = 'studenthub-offline';
const STORE = 'queue';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE, { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function addToOfflineQueue(action, payload) {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ id: `${Date.now()}_${Math.random()}`, action, payload, timestamp: Date.now() });
    return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
}

async function getOfflineQueue() {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readonly');
    return new Promise((res, rej) => {
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
    });
}

async function removeFromQueue(id) {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
}

// ────────────────────────────────────────────
// useOfflineSync hook
// ────────────────────────────────────────────
export function useOfflineSync(onQueueProcessed) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const onQueueProcessedRef = useRef(onQueueProcessed);
    onQueueProcessedRef.current = onQueueProcessed;

    const checkQueue = useCallback(async () => {
        const queue = await getOfflineQueue().catch(() => []);
        setPendingCount(queue.length);
    }, []);

    const processQueue = useCallback(async () => {
        if (!navigator.onLine) return;
        const queue = await getOfflineQueue().catch(() => []);
        if (queue.length === 0) return;

        setIsSyncing(true);
        let synced = 0;

        for (const item of queue) {
            try {
                if (item.action === 'add') {
                    await supabase.from('expenses').insert([item.payload]);
                } else if (item.action === 'delete') {
                    await supabase.from('expenses').delete().eq('id', item.payload.id).eq('user_id', item.payload.user_id);
                }
                await removeFromQueue(item.id);
                synced++;
            } catch (err) {
                console.error('Sync failed for item', item.id, err);
            }
        }

        setPendingCount(0);
        setIsSyncing(false);
        if (synced > 0 && onQueueProcessedRef.current) {
            onQueueProcessedRef.current(synced);
        }
    }, []);

    useEffect(() => {
        checkQueue();

        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for SW messages
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', (e) => {
                if (e.data?.type === 'PROCESS_QUEUE') processQueue();
            });
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkQueue, processQueue]);

    return { isOnline, pendingCount, isSyncing, processQueue, checkQueue };
}
