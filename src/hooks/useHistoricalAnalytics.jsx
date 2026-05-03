/**
 * useHistoricalAnalytics.js
 * Fetches last 90 days of transactions in ONE query and partitions
 * them into M-2, M-1, and current month buckets.
 * Exposes derived datasets via HistoricalAnalyticsContext.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// ─── Context ────────────────────────────────────────────────────────────────
export const HistoricalAnalyticsContext = createContext(null);

export function useHistoricalAnalyticsContext() {
    const ctx = useContext(HistoricalAnalyticsContext);
    if (!ctx) return getEmptyContext();
    return ctx;
}

function getEmptyContext() {
    return {
        twoMonthsAgo: [],
        lastMonth: [],
        thisMonth: [],
        baseline: [],
        trend: 'neutral',
        isBaselineReady: false,
        confidenceLevel: 'none',
        confidenceLabel: 'No prior month data',
        isLoading: false,
        error: null,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMonthBounds(year, month) {
    // month is 0-indexed
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

function isInMonth(date, year, month) {
    return date.getFullYear() === year && date.getMonth() === month;
}

function computeTrend(twoMonthsAgo, lastMonth) {
    const total2 = twoMonthsAgo.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const total1 = lastMonth.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    if (total2 === 0 || total1 === 0) return 'neutral';
    const delta = (total1 - total2) / total2;
    if (delta > 0.1) return 'up';
    if (delta < -0.1) return 'down';
    return 'stable';
}

function getConfidenceLevel(txCount) {
    if (txCount === 0) return { level: 'none', label: 'No prior month data. Insights will improve as you track more.' };
    if (txCount <= 4) return { level: 'low', label: `Based on ${txCount} transactions (low confidence — check back next month)` };
    if (txCount <= 14) return { level: 'moderate', label: `Based on ${txCount} transactions (moderate confidence)` };
    return { level: 'high', label: `Based on ${txCount} transactions` };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHistoricalAnalytics(userId) {
    const [rawData, setRawData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchHistoricalData = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);

        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

            const { data, error: fetchError } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', userId)
                .gte('date', ninetyDaysAgoStr)
                .order('date', { ascending: true });

            if (fetchError) throw fetchError;
            setRawData(data || []);
        } catch (err) {
            console.error('[useHistoricalAnalytics] fetch error:', err);
            setError(err);
            setRawData([]);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchHistoricalData();
    }, [fetchHistoricalData]);

    const value = useMemo(() => {
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonthIdx = now.getMonth(); // 0-indexed

        const lastMonthIdx = thisMonthIdx === 0 ? 11 : thisMonthIdx - 1;
        const lastMonthYear = thisMonthIdx === 0 ? thisYear - 1 : thisYear;

        const twoMonthsAgoIdx = lastMonthIdx === 0 ? 11 : lastMonthIdx - 1;
        const twoMonthsAgoYear = lastMonthIdx === 0 ? lastMonthYear - 1 : lastMonthYear;

        // Partition by month
        const twoMonthsAgo = [];
        const lastMonth = [];
        const thisMonth = [];

        rawData.forEach(t => {
            const d = new Date(t.date || t.created_at);
            if (isNaN(d)) return;
            if (isInMonth(d, twoMonthsAgoYear, twoMonthsAgoIdx)) twoMonthsAgo.push(t);
            else if (isInMonth(d, lastMonthYear, lastMonthIdx)) lastMonth.push(t);
            else if (isInMonth(d, thisYear, thisMonthIdx)) thisMonth.push(t);
        });

        const confidence = getConfidenceLevel(lastMonth.length);
        const isBaselineReady = lastMonth.length >= 5;
        const baseline = lastMonth; // single source of truth
        const trend = computeTrend(twoMonthsAgo, lastMonth);

        return {
            twoMonthsAgo,
            lastMonth,
            thisMonth,
            baseline,
            trend,
            isBaselineReady,
            confidenceLevel: confidence.level,
            confidenceLabel: confidence.label,
            isLoading,
            error,
            // Convenience metadata
            lastMonthName: new Date(lastMonthYear, lastMonthIdx, 1)
                .toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            thisMonthName: new Date(thisYear, thisMonthIdx, 1)
                .toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            twoMonthsAgoName: new Date(twoMonthsAgoYear, twoMonthsAgoIdx, 1)
                .toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            // Totals for quick access
            lastMonthTotal: lastMonth.reduce((s, t) => s + parseFloat(t.amount || 0), 0),
            thisMonthTotal: thisMonth.reduce((s, t) => s + parseFloat(t.amount || 0), 0),
            refetch: fetchHistoricalData,
        };
    }, [rawData, isLoading, error, fetchHistoricalData]);

    return value;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function HistoricalAnalyticsProvider({ userId, children }) {
    const value = useHistoricalAnalytics(userId);
    return (
        <HistoricalAnalyticsContext.Provider value={value}>
            {children}
        </HistoricalAnalyticsContext.Provider>
    );
}
