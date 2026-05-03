/**
 * analytics.js — Shared pure utility functions for all analytics features
 * All functions are pure (no side effects, no imports from React)
 * 
 * v2: History-based analytics (90-day baseline)
 */

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function isCurrentMonth(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isThisWeek(dateStr) {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    return d >= weekStart && d <= now;
}

function groupByCategory(txns) {
    const map = {};
    txns.forEach(t => {
        const cat = t.category || 'Other';
        if (!map[cat]) map[cat] = [];
        map[cat].push(t);
    });
    return map;
}

function sumAmount(txns) {
    return txns.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
}

function avgAmount(txns) {
    if (!txns.length) return 0;
    return sumAmount(txns) / txns.length;
}

function stdDev(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

function getDailySpendMap(txns) {
    const map = {};
    txns.forEach(t => {
        const date = (t.date || t.created_at || '').split('T')[0];
        if (!date) return;
        map[date] = (map[date] || 0) + parseFloat(t.amount || 0);
    });
    return map;
}

function getWeeksInMonth(txns) {
    // Returns 4 weekly buckets within the month
    if (!txns.length) return [[], [], [], []];
    const dates = txns.map(t => new Date(t.date || t.created_at)).sort((a, b) => a - b);
    const monthStart = new Date(dates[0].getFullYear(), dates[0].getMonth(), 1);
    const weeks = [[], [], [], []];
    txns.forEach(t => {
        const d = new Date(t.date || t.created_at);
        const dayOfMonth = d.getDate();
        const weekIdx = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
        weeks[weekIdx].push(t);
    });
    return weeks;
}

function getWeeklyAvgFromMonth(txns) {
    // Average weekly spend for a category from a full month of data
    const weeks = getWeeksInMonth(txns);
    const weekTotals = weeks.map(w => sumAmount(w));
    const nonZeroWeeks = weekTotals.filter(v => v > 0);
    if (!nonZeroWeeks.length) return 0;
    return nonZeroWeeks.reduce((s, v) => s + v, 0) / nonZeroWeeks.length;
}

function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 1: SPENDING PERSONALITY SCORE — HISTORY-BASED REWRITE
// ─────────────────────────────────────────────────────────────────
export function analyzeSpendingPersonality(lastMonthTxns = [], twoMonthsAgoTxns = [], budget = 0, thisMonthTxns = []) {
    // Determine primary source
    let sourceTxns = lastMonthTxns;
    let sourceLabel = 'last month';
    
    if (lastMonthTxns.length < 8) {
        // Fall back to last 60 days combined
        sourceTxns = [...twoMonthsAgoTxns, ...lastMonthTxns];
        sourceLabel = 'last 60 days';
    }

    if (sourceTxns.length === 0) {
        // Final fallback: use thisMonth if available
        if (thisMonthTxns.length > 0) {
            sourceTxns = thisMonthTxns;
            sourceLabel = 'this month (no prior history)';
        } else {
            return {
                archetype: 'New Explorer', emoji: '🌱', confidence: 0,
                confidenceLevel: 'none', txCount: 0,
                confidenceLabel: 'Add transactions to discover your spending personality!',
                traits: [], insight: 'Start tracking expenses to unlock insights.',
                improvement: 'Add more transactions.', drift: null,
                categoryComparison: [], sourceLabel,
            };
        }
    }

    const txCount = sourceTxns.length;
    const confidenceLevel = txCount >= 15 ? 'high' : txCount >= 5 ? 'moderate' : 'low';
    const confidenceLabel = txCount >= 15
        ? `Based on ${txCount} transactions`
        : txCount >= 5
        ? `Based on ${txCount} transactions (moderate confidence)`
        : `Based on ${txCount} transactions (low confidence — check back next month)`;

    const now = new Date();
    const totalSpent = sumAmount(sourceTxns);
    const daysInSource = sourceTxns.length > 0 ? (() => {
        const dates = sourceTxns.map(t => new Date(t.date || t.created_at));
        const minD = new Date(Math.min(...dates));
        const maxD = new Date(Math.max(...dates));
        return Math.max(Math.ceil((maxD - minD) / 86400000) + 1, 1);
    })() : 30;

    // ── Category totals ──
    const catTotals = {};
    sourceTxns.forEach(t => {
        const cat = (t.category || 'Other').toLowerCase();
        catTotals[cat] = (catTotals[cat] || 0) + parseFloat(t.amount || 0);
    });

    const food = catTotals['food & dining'] || catTotals['food'] || catTotals['food & drink'] || 0;
    const entertainment = catTotals['entertainment'] || 0;
    const shopping = catTotals['shopping'] || catTotals['personal care'] || 0;
    const transport = catTotals['transportation'] || catTotals['transport'] || 0;

    // ── Time-based analysis ──
    const lateNightTx = sourceTxns.filter(t => {
        const h = new Date(t.date || t.created_at).getHours();
        return h >= 22 || h <= 3;
    });
    const nightOwlScore = lateNightTx.length / sourceTxns.length;

    // ── Day-of-week analysis ──
    const weekendSpend = sourceTxns
        .filter(t => { const d = new Date(t.date || t.created_at).getDay(); return d === 0 || d === 6; })
        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const weekendScore = totalSpent > 0 ? weekendSpend / totalSpent : 0;

    // ── Frequency & variance ──
    const txPerDay = sourceTxns.length / daysInSource;
    const avgTxAmount = totalSpent / sourceTxns.length;

    const dailySpendMap = getDailySpendMap(sourceTxns);
    const dailyValues = Object.values(dailySpendMap);
    const avgDailySpend = dailyValues.reduce((s, v) => s + v, 0) / Math.max(dailyValues.length, 1);
    const dailyStdDev = stdDev(dailyValues);

    // ── Planner: low variance in daily spending ──
    const plannerScore = avgDailySpend > 0
        ? Math.max(0, 1 - (dailyStdDev / (avgDailySpend * 0.3 + 0.01)))
        : 0;

    // ── Normalized scores (0–1) ──
    const scores = {
        nightOwl:        nightOwlScore > 0.4 ? 0.9 : nightOwlScore * 2,
        impulsive:       (txPerDay > 3 && avgTxAmount < 200) ? Math.min(txPerDay / 5, 1.0) : 0,
        planner:         Math.max(0, Math.min(plannerScore, 1.0)) * (txPerDay < 1.5 ? 1.0 : 0.5),
        foodie:          totalSpent > 0 ? food / totalSpent : 0,
        socialButterfly: totalSpent > 0 ? (food + entertainment) / totalSpent : 0,
        minimalist:      budget > 0 && totalSpent < budget * 0.6 ? 0.9 : 0,
        weekendWarrior:  weekendScore,
        balanced:        (() => {
            const catCount = Object.keys(catTotals).length;
            const maxCatPct = totalSpent > 0 ? Math.max(...Object.values(catTotals)) / totalSpent : 0;
            return (maxCatPct < 0.3 && catCount >= 4) ? 0.85 : 0;
        })(),
    };

    const archetypeMap = {
        nightOwl:        { name: 'The Night Owl Spender', emoji: '🦉', improvement: 'Try setting a cut-off time after 10PM for non-essential purchases.' },
        impulsive:       { name: 'The Impulsive Buyer', emoji: '⚡', improvement: 'Implement a 24-hour waiting rule before any purchase under ₹500.' },
        planner:         { name: 'The Planner', emoji: '📋', improvement: "You're great at planning — consider automating your savings too!" },
        foodie:          { name: 'The Foodie', emoji: '🍕', improvement: 'Try cooking at home 3 days a week to reduce food spend by ~30%.' },
        socialButterfly: { name: 'The Social Butterfly', emoji: '🦋', improvement: 'Suggest free or low-cost social activities with friends once a week.' },
        minimalist:      { name: 'The Minimalist', emoji: '🧊', improvement: 'Excellent control! Consider investing your surplus in a high-yield savings account.' },
        weekendWarrior:  { name: 'The Weekend Warrior', emoji: '🏄', improvement: 'Plan weekend budgets in advance to avoid Monday regrets.' },
        balanced:        { name: 'The Balanced Student', emoji: '⚖️', improvement: "You're perfectly balanced — now focus on building your savings rate." },
    };

    // Winner: highest score above threshold 0.35
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topKey, topScore] = sorted[0];
    const archetypeKey = topScore >= 0.35 ? topKey : 'balanced';
    const archetype = archetypeMap[archetypeKey];
    const confidence = Math.min(Math.round(topScore * 100), 100);

    // ── Traits ──
    const traits = [];
    if (nightOwlScore > 0.15) traits.push(`${Math.round(nightOwlScore * 100)}% of purchases happen after 10PM`);
    if (txPerDay > 2) traits.push(`Averages ${txPerDay.toFixed(1)} transactions/day`);
    if (food > 0) traits.push(`₹${Math.round(food).toLocaleString('en-IN')} spent on Food (${Math.round(food / totalSpent * 100)}%)`);
    if (weekendScore > 0.3) traits.push(`${Math.round(weekendScore * 100)}% of spending happens on weekends`);
    if (Object.keys(catTotals).length >= 4) traits.push(`Spending spread across ${Object.keys(catTotals).length} categories`);
    if (avgTxAmount > 0) traits.push(`Avg transaction size: ₹${Math.round(avgTxAmount).toLocaleString('en-IN')}`);

    // ── Personality drift ──
    let drift = null;
    if (twoMonthsAgoTxns.length >= 5 && lastMonthTxns.length >= 5) {
        const prevScore = analyzeSpendingPersonality(twoMonthsAgoTxns, [], budget, []);
        if (prevScore.archetypeKey && prevScore.archetypeKey !== archetypeKey) {
            // Find biggest category shift
            const prevCatTotals = {};
            twoMonthsAgoTxns.forEach(t => {
                const cat = t.category || 'Other';
                prevCatTotals[cat] = (prevCatTotals[cat] || 0) + parseFloat(t.amount || 0);
            });
            const currCatTotalsRaw = {};
            lastMonthTxns.forEach(t => {
                const cat = t.category || 'Other';
                currCatTotalsRaw[cat] = (currCatTotalsRaw[cat] || 0) + parseFloat(t.amount || 0);
            });

            const allCats = [...new Set([...Object.keys(prevCatTotals), ...Object.keys(currCatTotalsRaw)])];
            const topShift = allCats
                .map(cat => ({
                    cat,
                    prev: prevCatTotals[cat] || 0,
                    curr: currCatTotalsRaw[cat] || 0,
                    delta: ((currCatTotalsRaw[cat] || 0) - (prevCatTotals[cat] || 0)),
                }))
                .filter(x => x.prev > 0 || x.curr > 0)
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .slice(0, 2);

            const shiftDesc = topShift.map(s => {
                const pct = s.prev > 0 ? Math.round(((s.curr - s.prev) / s.prev) * 100) : 999;
                return `${s.cat} ${pct > 0 ? '+' : ''}${pct}%`;
            }).join(', ');

            const lateNightDelta = lateNightTx.length - twoMonthsAgoTxns.filter(t => {
                const h = new Date(t.date || t.created_at).getHours();
                return h >= 22 || h <= 3;
            }).length;

            drift = {
                from: prevScore.archetype,
                fromEmoji: prevScore.emoji,
                to: archetype.name,
                toEmoji: archetype.emoji,
                detail: `${shiftDesc}${lateNightDelta !== 0 ? `, late-night txns ${lateNightDelta > 0 ? '+' : ''}${lateNightDelta}` : ''}`,
            };
        }
    }

    // ── This month vs last month category comparison ──
    const categoryComparison = [];
    if (lastMonthTxns.length > 0 && thisMonthTxns.length > 0) {
        const lastCatMap = {};
        lastMonthTxns.forEach(t => {
            const cat = t.category || 'Other';
            lastCatMap[cat] = (lastCatMap[cat] || 0) + parseFloat(t.amount || 0);
        });
        const thisCatMap = {};
        thisMonthTxns.forEach(t => {
            const cat = t.category || 'Other';
            thisCatMap[cat] = (thisCatMap[cat] || 0) + parseFloat(t.amount || 0);
        });

        const allCats = [...new Set([...Object.keys(lastCatMap), ...Object.keys(thisCatMap)])];
        allCats.forEach(cat => {
            const last = lastCatMap[cat] || 0;
            const curr = thisCatMap[cat] || 0;
            const pct = last > 0 ? Math.round(((curr - last) / last) * 100) : (curr > 0 ? 100 : 0);
            categoryComparison.push({ category: cat, thisMonth: Math.round(curr), lastMonth: Math.round(last), pctChange: pct });
        });
        categoryComparison.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
    }

    return {
        archetype: archetype.name,
        archetypeKey,
        emoji: archetype.emoji,
        confidence,
        confidenceLevel,
        confidenceLabel,
        txCount,
        sourceLabel,
        traits: traits.slice(0, 4),
        insight: `Based on your ${txCount} transactions in ${sourceLabel} totaling ₹${Math.round(totalSpent).toLocaleString('en-IN')}.`,
        improvement: archetype.improvement,
        drift,
        categoryComparison,
    };
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 2: ANOMALY DETECTION — WITH ROOT CAUSE + ACTIONABLE INSIGHTS
// ─────────────────────────────────────────────────────────────────

function detectRootCause(thisWeekCatTxns, lastMonthCatTxns, baseline) {
    const count = thisWeekCatTxns.length;
    const total = sumAmount(thisWeekCatTxns);
    
    // Last month weekly average count
    const lastMonthWeeks = getWeeksInMonth(lastMonthCatTxns);
    const nonEmptyWeeks = lastMonthWeeks.filter(w => w.length > 0);
    const avgWeeklyCount = nonEmptyWeeks.length > 0
        ? nonEmptyWeeks.reduce((s, w) => s + w.length, 0) / nonEmptyWeeks.length
        : 1;
    
    const lastMonthAvgAmount = avgAmount(lastMonthCatTxns);

    // Single large transaction
    if (count === 1 && total > baseline * 2) {
        return {
            type: 'single_large_transaction',
            detail: `One large purchase of ₹${Math.round(total).toLocaleString('en-IN')} this week`,
            avgWeeklyCount,
            lastMonthAvgAmount,
        };
    }
    // Frequency spike
    if (count > avgWeeklyCount * 2 && avgWeeklyCount > 0) {
        return {
            type: 'frequency_spike',
            detail: `${count} purchases this week vs your usual ${Math.round(avgWeeklyCount * 10) / 10}–${Math.ceil(avgWeeklyCount + 1)}`,
            avgWeeklyCount,
            lastMonthAvgAmount,
        };
    }
    // Amount per txn spike
    const thisAvgAmount = count > 0 ? total / count : 0;
    if (count > 0 && lastMonthAvgAmount > 0 && thisAvgAmount > lastMonthAvgAmount * 1.5) {
        return {
            type: 'amount_per_txn_spike',
            detail: `Each purchase costs ₹${Math.round(thisAvgAmount).toLocaleString('en-IN')} avg vs your usual ₹${Math.round(lastMonthAvgAmount).toLocaleString('en-IN')}`,
            avgWeeklyCount,
            lastMonthAvgAmount,
        };
    }
    // New category
    if (lastMonthCatTxns.length === 0) {
        return {
            type: 'new_category_activity',
            detail: `No ${thisWeekCatTxns[0]?.category || 'this category'} spending in prior months`,
            avgWeeklyCount,
            lastMonthAvgAmount,
        };
    }
    return {
        type: 'general_increase',
        detail: 'Multiple factors contributing to higher spend',
        avgWeeklyCount,
        lastMonthAvgAmount,
    };
}

function generateActionableInsight(rootCause, category, amount, detail) {
    const cat = (category || '').toLowerCase();
    const amt = Math.round(amount);

    const templates = {
        single_large_transaction: {
            food: `One large meal/order drove this spike (₹${amt.toLocaleString('en-IN')}). Consider meal-prepping or splitting costs with friends next time.`,
            shopping: `One large purchase drove this spike. If unplanned, try the 48-hour rule before your next big buy.`,
            entertainment: `One outing or event drove this. Look for student discounts to reduce future costs.`,
            transport: `A large one-time commute cost. Consider a weekly/monthly pass if routes are predictable.`,
            default: `One large purchase. Was this planned? If not, set a ₹${Math.round(amount * 0.5).toLocaleString('en-IN')}/month cap to prevent recurrence.`,
        },
        frequency_spike: {
            food: `You're eating out far more than usual. Cooking 2 meals/week at home could save ₹${Math.round(amount * 0.4).toLocaleString('en-IN')} this month.`,
            shopping: `Multiple shopping trips this week. Try batching into one weekly trip with a fixed list.`,
            entertainment: `Lots of outings this week. Plan a free-activity week next week to rebalance.`,
            transport: `Many rides this week vs usual. A weekly/monthly pass could reduce this by ~30%.`,
            default: `High frequency this week. Try batching errands into 1–2 trips instead of daily.`,
        },
        amount_per_txn_spike: {
            food: `Per-meal cost has jumped. Swap 1-2 restaurant meals/week for home cooking to balance.`,
            shopping: `Per-item cost jumped. Consider mid-range alternatives for routine purchases.`,
            entertainment: `Per-outing cost rose. Look for student discounts or free campus events this weekend.`,
            transport: `Per-trip cost rose. Car-pooling or shared rides could cut this significantly.`,
            default: `Per-purchase cost rose sharply. Compare prices online before your next purchase.`,
        },
        new_category_activity: {
            default: `New spending area. If this will recur, consider adding it to your monthly budget allocation.`,
        },
        general_increase: {
            default: `Multiple factors driving higher spend. Review this week's transactions to identify patterns.`,
        },
    };

    const catKey = cat.includes('food') ? 'food'
        : cat.includes('shop') || cat.includes('personal') || cat.includes('cloth') ? 'shopping'
        : cat.includes('entertain') ? 'entertainment'
        : cat.includes('transport') ? 'transport'
        : 'default';

    const template = templates[rootCause.type] || templates.general_increase;
    return template[catKey] || template.default;
}

export function detectAnomalies(allTransactions = [], lastMonthTxns = []) {
    // Fallback: use allTransactions if no historical data provided
    const hasHistorical = lastMonthTxns.length > 0;
    
    if (!allTransactions || allTransactions.length < 3) return [];

    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekTxns = allTransactions.filter(t => new Date(t.date || t.created_at) >= weekStart);
    const categories = [...new Set(allTransactions.map(t => t.category).filter(Boolean))];
    const anomalies = [];
    
    const lastMonthByCat = groupByCategory(lastMonthTxns);

    categories.forEach(cat => {
        const thisWeekCatTxns = thisWeekTxns.filter(t => t.category === cat);
        const currentWeekSpend = sumAmount(thisWeekCatTxns);
        if (currentWeekSpend === 0) return;

        let baseline = 0;
        let rollingAvg = 0;

        if (hasHistorical) {
            // PRIMARY: use last month's weekly average
            const lastMonthCatTxns = lastMonthByCat[cat] || [];
            baseline = getWeeklyAvgFromMonth(lastMonthCatTxns);
        }

        if (baseline < 30) {
            // FALLBACK: use 4-week rolling average from all transactions
            const catTx = allTransactions.filter(t => t.category === cat);
            const weeks = [];
            for (let w = 0; w < 5; w++) {
                const wStart = new Date(weekStart);
                wStart.setDate(weekStart.getDate() - (w + 1) * 7);
                const wEnd = new Date(weekStart);
                wEnd.setDate(weekStart.getDate() - w * 7 - 1);
                wEnd.setHours(23, 59, 59, 999);
                const weekSpend = catTx
                    .filter(t => { const d = new Date(t.date || t.created_at); return d >= wStart && d <= wEnd; })
                    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                weeks.push(weekSpend);
            }
            rollingAvg = weeks.slice(1).reduce((s, v) => s + v, 0) / 4;
            baseline = rollingAvg;
        }

        if (baseline < 30) return;

        const ratio = currentWeekSpend / baseline;
        const percentageIncrease = Math.round((ratio - 1) * 100);

        if (ratio >= 1.75) {
            const lastMonthCatTxns = lastMonthByCat[cat] || [];
            const rootCause = detectRootCause(thisWeekCatTxns, lastMonthCatTxns, baseline);
            const actionableInsight = generateActionableInsight(rootCause, cat, currentWeekSpend - baseline, rootCause.detail);

            anomalies.push({
                category: cat,
                currentWeekSpend: Math.round(currentWeekSpend),
                rollingAvg: Math.round(rollingAvg || baseline),
                baseline: Math.round(baseline),
                percentageIncrease,
                severity: ratio >= 2.5 ? 'critical' : 'warning',
                rootCause: rootCause.type,
                rootCauseDetail: rootCause.detail,
                actionableInsight,
                savingsOpportunity: Math.max(0, Math.round(currentWeekSpend - baseline)),
            });
        }
    });

    return anomalies.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
        return b.percentageIncrease - a.percentageIncrease;
    }).slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 5: PREDICTIVE MONTH-END FORECAST — CALIBRATED w/ HISTORY
// ─────────────────────────────────────────────────────────────────

function computeDailyWeightCurve(lastMonthTxns) {
    // Returns an array of 31 multipliers (one per day of month)
    // Each represents how that day's spend compares to the monthly average day
    if (!lastMonthTxns || lastMonthTxns.length === 0) return null;

    const dailySpend = {};
    let totalDays = 0;
    lastMonthTxns.forEach(t => {
        const d = new Date(t.date || t.created_at);
        const dayOfMonth = d.getDate(); // 1-indexed
        dailySpend[dayOfMonth] = (dailySpend[dayOfMonth] || 0) + parseFloat(t.amount || 0);
        totalDays = Math.max(totalDays, dayOfMonth);
    });

    if (totalDays === 0) return null;

    const total = Object.values(dailySpend).reduce((s, v) => s + v, 0);
    const avgDailySpend = total / totalDays;

    if (avgDailySpend === 0) return null;

    // Build weight array (index 0 = day 1)
    const weights = Array(31).fill(1.0);
    for (let day = 1; day <= totalDays; day++) {
        const spend = dailySpend[day] || 0;
        weights[day - 1] = spend / avgDailySpend;
    }

    return weights;
}

export function calculateForecast(transactions, budget, today = new Date(), lastMonthTxns = []) {
    // Step 1: Only current calendar month transactions
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = getDaysInMonth(today);
    const daysElapsed = today.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    const monthTx = transactions.filter(t => {
        const d = new Date(t.date || t.created_at);
        return d >= monthStart && d <= today;
    });

    const totalSpentThisMonth = sumAmount(monthTx);

    if (daysElapsed < 2) {
        return { status: 'no-data', message: 'Not enough data yet', projectedMonthEnd: 0, confidence: 0, dailyCutRequired: 0 };
    }

    // Step 2: Daily velocity (current month)
    const dailyVelocity = totalSpentThisMonth / daysElapsed;

    // Step 3: Calibrate against last month's daily pattern
    const lastMonthWeights = computeDailyWeightCurve(lastMonthTxns);

    // Step 4: Weighted projection for remaining days
    let projectedRemaining = 0;
    if (lastMonthWeights && daysRemaining > 0) {
        for (let i = 0; i < daysRemaining; i++) {
            const futureDay = daysElapsed + i + 1;
            const weight = lastMonthWeights[futureDay - 1] !== undefined
                ? lastMonthWeights[futureDay - 1]
                : 1.0;
            projectedRemaining += dailyVelocity * weight;
        }
    } else {
        projectedRemaining = dailyVelocity * daysRemaining;
    }

    const projectedMonthEnd = Math.round(totalSpentThisMonth + projectedRemaining);

    // Step 5: Confidence
    const confidence = Math.min(daysElapsed / 10, 1.0);

    const projectedOverrun = projectedMonthEnd - budget;
    const dailyCutRequired = daysRemaining > 0 ? Math.max(projectedOverrun / daysRemaining, 0) : 0;

    // Top category for "get back on track" advice
    const catSpend = {};
    monthTx.forEach(t => {
        const cat = t.category || 'Other';
        catSpend[cat] = (catSpend[cat] || 0) + parseFloat(t.amount || 0);
    });
    const topCategoryEntry = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : null;
    const topCategorySpend = topCategoryEntry ? topCategoryEntry[1] : 0;
    const topCategoryDailySpend = daysElapsed > 0 ? topCategorySpend / daysElapsed : 0;

    // Last month total for comparison strip
    const lastMonthTotal = sumAmount(lastMonthTxns);

    const status = projectedMonthEnd > budget * 1.1 ? 'danger'
        : projectedMonthEnd > budget * 0.9 ? 'warning'
        : 'safe';

    return {
        status,
        projectedMonthEnd,
        totalSpentThisMonth: Math.round(totalSpentThisMonth),
        confidence: Math.round(confidence * 100),
        daysElapsed,
        daysInMonth,
        daysRemaining,
        projectedOverrun: Math.round(projectedOverrun),
        dailyCutRequired: Math.round(dailyCutRequired),
        budget,
        topCategory,
        topCategoryDailySpend: Math.round(topCategoryDailySpend),
        lastMonthTotal: Math.round(lastMonthTotal),
        isCalibrated: !!lastMonthWeights,
    };
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 10: SPENDING ACTION PLAN GENERATOR
// ─────────────────────────────────────────────────────────────────
export function generateActionPlan(thisMonthTxns = [], lastMonthTxns = [], budget = 0) {
    const now = new Date();
    const daysElapsed = now.getDate();
    const daysInMonth = getDaysInMonth(now);
    const daysRemaining = Math.max(daysInMonth - daysElapsed, 1);

    const thisTotal = sumAmount(thisMonthTxns);
    const lastTotal = sumAmount(lastMonthTxns);

    const dailyVelocity = daysElapsed > 0 ? thisTotal / daysElapsed : 0;
    const projectedTotal = thisTotal + dailyVelocity * daysRemaining;
    const overspend = projectedTotal - budget;

    const isOverspending = budget > 0 && projectedTotal > budget;

    const actions = [];

    // ── Action type 1: Rising categories vs last month ──
    const thisCatMap = {};
    thisMonthTxns.forEach(t => {
        const cat = t.category || 'Other';
        thisCatMap[cat] = (thisCatMap[cat] || 0) + parseFloat(t.amount || 0);
    });
    const lastCatMap = {};
    lastMonthTxns.forEach(t => {
        const cat = t.category || 'Other';
        lastCatMap[cat] = (lastCatMap[cat] || 0) + parseFloat(t.amount || 0);
    });

    const allCats = [...new Set([...Object.keys(thisCatMap), ...Object.keys(lastCatMap)])];
    allCats.forEach(cat => {
        const thisSpend = thisCatMap[cat] || 0;
        const lastSpend = lastCatMap[cat] || 0;
        const thisProjected = daysElapsed > 0 ? (thisSpend / daysElapsed) * daysInMonth : 0;

        if (lastSpend > 100 && thisProjected > lastSpend * 1.2) {
            const excess = thisProjected - lastSpend;
            const dailyCut = excess / daysRemaining;
            const catIcon = cat.toLowerCase().includes('food') ? '🍔'
                : cat.toLowerCase().includes('shop') ? '🛍️'
                : cat.toLowerCase().includes('entertain') ? '🎬'
                : cat.toLowerCase().includes('transport') ? '🚗'
                : '📦';
            actions.push({
                type: 'reduce_category',
                icon: catIcon,
                category: cat,
                label: `Cut ${cat} by ₹${Math.round(dailyCut).toLocaleString('en-IN')}/day`,
                monthlySaving: Math.round(excess),
                evidence: `You spent ₹${Math.round(lastSpend).toLocaleString('en-IN')} on ${cat} last month, ₹${Math.round(thisSpend).toLocaleString('en-IN')} so far`,
                priority: excess,
            });
        }
    });

    // ── Action type 2: Behavioral — late-night ──
    const lateNightTxns = lastMonthTxns.filter(t => {
        const h = new Date(t.date || t.created_at).getHours();
        return h >= 22 || h <= 3;
    });
    const lateNightPct = lastMonthTxns.length > 0 ? lateNightTxns.length / lastMonthTxns.length : 0;
    const lateNightSpend = sumAmount(lateNightTxns);

    if (lateNightPct > 0.15 && lateNightSpend > 200) {
        actions.push({
            type: 'behavioral',
            icon: '🌙',
            label: 'Avoid late-night spending',
            monthlySaving: Math.round(lateNightSpend),
            evidence: `${Math.round(lateNightPct * 100)}% of your spend happens after 10PM`,
            priority: lateNightSpend,
        });
    }

    // ── Action type 3: Frequency spikes this week ──
    const now7 = new Date(now);
    now7.setDate(now.getDate() - 7);
    const thisWeekMap = groupByCategory(thisMonthTxns.filter(t => new Date(t.date || t.created_at) >= now7));
    const lastMonthByCat = groupByCategory(lastMonthTxns);

    Object.entries(thisWeekMap).forEach(([cat, txns]) => {
        const thisWeekCount = txns.length;
        const lastMonthWeeks = getWeeksInMonth(lastMonthByCat[cat] || []);
        const nonEmpty = lastMonthWeeks.filter(w => w.length > 0);
        if (!nonEmpty.length) return;
        const avgWeeklyCount = nonEmpty.reduce((s, w) => s + w.length, 0) / nonEmpty.length;
        if (thisWeekCount > avgWeeklyCount * 2 && thisWeekCount >= 3) {
            const excessCount = thisWeekCount - avgWeeklyCount;
            const avgSpendPerTxn = sumAmount(txns) / thisWeekCount;
            const monthlySaving = Math.round(excessCount * avgSpendPerTxn * 4);
            if (monthlySaving > 200) {
                actions.push({
                    type: 'reduce_frequency',
                    icon: '🔄',
                    label: `Reduce ${cat} trips`,
                    monthlySaving,
                    evidence: `${thisWeekCount} purchases this week vs usual ${Math.round(avgWeeklyCount * 10) / 10}`,
                    priority: monthlySaving,
                });
            }
        }
    });

    const top3 = actions.sort((a, b) => b.priority - a.priority).slice(0, 3);
    const totalSavable = top3.reduce((s, a) => s + a.monthlySaving, 0);

    return {
        actions: top3,
        totalSavable,
        isOverspending,
        projectedTotal: Math.round(projectedTotal),
        overspend: Math.round(Math.max(overspend, 0)),
        status: isOverspending ? 'danger' : 'safe',
    };
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 6: RECURRING SPEND DETECTOR
// ─────────────────────────────────────────────────────────────────
export function detectRecurringTransactions(transactions) {
    if (!transactions || transactions.length < 3) return [];

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recent = transactions.filter(t => new Date(t.date || t.created_at) >= ninetyDaysAgo);

    const groups = {};
    recent.forEach(t => {
        const desc = (t.description || '').toLowerCase().trim().split(' | note:')[0];
        const amount = Math.round(parseFloat(t.amount || 0) / 10) * 10;
        const key = `${desc}|${amount}`;
        if (!groups[key]) groups[key] = { description: t.description || desc, amount: parseFloat(t.amount || 0), category: t.category, dates: [] };
        groups[key].dates.push(new Date(t.date || t.created_at));
    });

    const recurring = [];

    Object.values(groups).forEach(g => {
        if (g.dates.length < 2) return;
        g.dates.sort((a, b) => a - b);

        const intervals = [];
        for (let i = 1; i < g.dates.length; i++) {
            intervals.push((g.dates[i] - g.dates[i - 1]) / (1000 * 60 * 60 * 24));
        }

        const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
        const variance = intervals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / intervals.length;
        const stddev = Math.sqrt(variance);
        const regularityScore = mean > 0 ? 1 - (stddev / mean) : 0;

        if (regularityScore < 0.55 || g.dates.length < 2) return;

        let frequency = 'irregular';
        let frequencyLabel = 'Irregular';
        if (mean >= 5 && mean <= 9) { frequency = 'weekly'; frequencyLabel = 'Every ~7 days'; }
        else if (mean >= 12 && mean <= 16) { frequency = 'biweekly'; frequencyLabel = 'Every ~2 weeks'; }
        else if (mean >= 26 && mean <= 34) { frequency = 'monthly'; frequencyLabel = 'Every ~30 days'; }
        else if (mean >= 85 && mean <= 95) { frequency = 'quarterly'; frequencyLabel = 'Every ~3 months'; }
        else return;

        recurring.push({
            id: `${g.description}-${g.amount}`,
            description: g.description,
            amount: parseFloat(g.amount.toFixed(2)),
            category: g.category,
            frequency,
            frequencyLabel,
            occurrences: g.dates.length,
            regularityScore: Math.round(regularityScore * 100),
            lastSeen: g.dates[g.dates.length - 1].toISOString().split('T')[0],
        });
    });

    return recurring.sort((a, b) => b.regularityScore - a.regularityScore);
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 8: CATEGORY CORRELATION MATRIX
// ─────────────────────────────────────────────────────────────────
export function calculateCategoryCorrelations(transactions) {
    if (!transactions || transactions.length < 30) {
        const daysNeeded = 30 - [...new Set(transactions.map(t => (t.date || t.created_at || '').split('T')[0]))].length;
        return { matrix: {}, categories: [], insufficient: true, daysNeeded: Math.max(daysNeeded, 0) };
    }

    const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    if (categories.length < 2) return { matrix: {}, categories: [], insufficient: true, daysNeeded: 0 };

    const dateMap = {};
    transactions.forEach(t => {
        const date = (t.date || t.created_at || '').split('T')[0];
        if (!date) return;
        if (!dateMap[date]) dateMap[date] = {};
        categories.forEach(c => { if (!dateMap[date][c]) dateMap[date][c] = 0; });
        dateMap[date][t.category] = (dateMap[date][t.category] || 0) + parseFloat(t.amount || 0);
    });

    const dates = Object.keys(dateMap).sort();
    const allDates = [];
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!dateMap[key]) dateMap[key] = {};
        categories.forEach(c => { if (!dateMap[key][c]) dateMap[key][c] = 0; });
        allDates.push(key);
    }

    const pearson = (xArr, yArr) => {
        const n = xArr.length;
        if (n < 5) return 0;
        const xMean = xArr.reduce((s, v) => s + v, 0) / n;
        const yMean = yArr.reduce((s, v) => s + v, 0) / n;
        const num = xArr.reduce((s, v, i) => s + (v - xMean) * (yArr[i] - yMean), 0);
        const denX = Math.sqrt(xArr.reduce((s, v) => s + Math.pow(v - xMean, 2), 0));
        const denY = Math.sqrt(yArr.reduce((s, v) => s + Math.pow(v - yMean, 2), 0));
        if (denX === 0 || denY === 0) return 0;
        return num / (denX * denY);
    };

    const matrix = {};
    const insights = [];

    categories.forEach(catA => {
        matrix[catA] = {};
        categories.forEach(catB => {
            if (catA === catB) { matrix[catA][catB] = 1; return; }
            const xArr = allDates.map(d => dateMap[d][catA] || 0);
            const yArr = allDates.map(d => dateMap[d][catB] || 0);
            const r = pearson(xArr, yArr);
            matrix[catA][catB] = parseFloat(r.toFixed(3));
        });
    });

    const pairs = [];
    categories.forEach((catA, i) => {
        categories.slice(i + 1).forEach(catB => {
            const r = matrix[catA][catB];
            if (Math.abs(r) > 0.3) pairs.push({ catA, catB, r });
        });
    });
    pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    pairs.slice(0, 3).forEach(({ catA, catB, r }) => {
        if (r > 0) insights.push(`When you spend on ${catA}, ${catB} tends to be ${Math.round(r * 100)}% higher on the same day.`);
        else insights.push(`${catA} and ${catB} rarely spike together (r=${r.toFixed(2)}).`);
    });

    return { matrix, categories, insufficient: false, insights };
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 13: STREAKS & BADGES
// ─────────────────────────────────────────────────────────────────
export function evaluateStreaksAndBadges(transactions, budget) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const daysInMonth = getDaysInMonth(today);
    const dailyBudget = budget > 0 ? budget / daysInMonth : Infinity;

    const dailySpend = {};
    transactions.forEach(t => {
        const date = (t.date || t.created_at || '').split('T')[0];
        if (!date) return;
        dailySpend[date] = (dailySpend[date] || 0) + parseFloat(t.amount || 0);
    });

    let underBudgetStreak = 0;
    for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const spend = dailySpend[key] || 0;
        if (spend < dailyBudget) underBudgetStreak++;
        else break;
    }

    const lateNightCategories = ['shopping', 'entertainment'];
    const lateNightTxByDate = {};
    transactions.forEach(t => {
        const d = new Date(t.date || t.created_at);
        const h = d.getHours();
        if ((h >= 22 || h <= 2) && lateNightCategories.includes((t.category || '').toLowerCase())) {
            const key = d.toISOString().split('T')[0];
            lateNightTxByDate[key] = true;
        }
    });
    let noImpulseStreak = 0;
    for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (!lateNightTxByDate[key]) noImpulseStreak++;
        else break;
    }

    let loggingStreak = 0;
    for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (dailySpend[key] > 0) loggingStreak++;
        else break;
    }

    const currentStreaks = [
        underBudgetStreak > 0 && { type: 'underBudget', label: 'Under Budget', days: underBudgetStreak, icon: '❄️', color: '#3b82f6' },
        noImpulseStreak > 0 && { type: 'noImpulse', label: 'No Impulse', days: noImpulseStreak, icon: '🛑', color: '#10b981' },
        loggingStreak > 1 && { type: 'logging', label: 'Consistent', days: loggingStreak, icon: '📅', color: '#8b5cf6' },
    ].filter(Boolean);

    const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTx = transactions.filter(t => new Date(t.date || t.created_at) >= monthStart);
    const monthSpend = sumAmount(monthTx);

    const allBadges = [
        { id: 'ice_cold', name: 'Ice Cold', emoji: '🧊', desc: '7-day under-budget streak', earned: underBudgetStreak >= 7 },
        { id: 'on_fire', name: 'On Fire', emoji: '🔥', desc: '14-day under-budget streak', earned: underBudgetStreak >= 14 },
        { id: 'bullseye', name: 'Bullseye', emoji: '🎯', desc: 'Spent within 5% of budget for full month', earned: budget > 0 && monthSpend >= budget * 0.95 && monthSpend <= budget },
        { id: 'night_owl_reformed', name: 'Night Owl Reformed', emoji: '🦉', desc: '30 days with zero late-night transactions', earned: noImpulseStreak >= 30 },
        { id: 'piggy_bank', name: 'Piggy Bank', emoji: '🐷', desc: 'Saved 20%+ this month', earned: budget > 0 && monthSpend < budget * 0.8 },
        { id: 'category_master', name: 'Category Master', emoji: '🧠', desc: 'Used every category at least once', earned: categories.length >= 6 },
        { id: 'consistent', name: 'Consistent', emoji: '📅', desc: 'Logged at least 1 transaction every day for 14 days', earned: loggingStreak >= 14 },
    ];

    return { currentStreaks, allBadges, underBudgetStreak, noImpulseStreak, loggingStreak };
}

// ─────────────────────────────────────────────────────────────────
// FEATURE 3: HEATMAP DATA BUILDER
// ─────────────────────────────────────────────────────────────────
export function buildHeatmapData(transactions, weeks = 12) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dateMap = {};
    transactions.forEach(t => {
        const date = (t.date || t.created_at || '').split('T')[0];
        if (!date) return;
        if (!dateMap[date]) dateMap[date] = { amount: 0, count: 0 };
        dateMap[date].amount += parseFloat(t.amount || 0);
        dateMap[date].count += 1;
    });

    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const gridStart = new Date(today);
    gridStart.setDate(today.getDate() - dayOfWeek - (weeks - 1) * 7);
    gridStart.setHours(0, 0, 0, 0);

    const cells = [];
    for (let w = 0; w < weeks; w++) {
        for (let d = 0; d < 7; d++) {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + w * 7 + d);
            const key = date.toISOString().split('T')[0];
            const isFuture = date > today;
            cells.push({
                date: key,
                dayOfWeek: d,
                week: w,
                amount: isFuture ? -1 : (dateMap[key]?.amount || 0),
                count: isFuture ? 0 : (dateMap[key]?.count || 0),
                isFuture,
            });
        }
    }

    const amounts = cells.filter(c => !c.isFuture && c.amount > 0).map(c => c.amount).sort((a, b) => a - b);
    const getPercentile = (pct) => {
        if (amounts.length === 0) return 0;
        const idx = Math.ceil(amounts.length * pct / 100) - 1;
        return amounts[Math.max(0, idx)] || 0;
    };
    const p25 = getPercentile(25);
    const p50 = getPercentile(50);
    const p75 = getPercentile(75);

    const getIntensity = (amount) => {
        if (amount <= 0) return 0;
        if (amount <= p25) return 1;
        if (amount <= p50) return 2;
        if (amount <= p75) return 3;
        return 4;
    };

    cells.forEach(c => { c.intensity = c.isFuture ? -1 : getIntensity(c.amount); });

    const dayTotals = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);
    cells.filter(c => !c.isFuture && c.amount > 0).forEach(c => {
        dayTotals[c.dayOfWeek] += c.amount;
        dayCounts[c.dayOfWeek]++;
    });
    const dayAvgs = dayTotals.map((t, i) => dayCounts[i] > 0 ? t / dayCounts[i] : 0);
    const heaviestDayIdx = dayAvgs.indexOf(Math.max(...dayAvgs));
    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heaviestDay = DAY_NAMES[heaviestDayIdx];
    const heaviestAvg = Math.round(dayAvgs[heaviestDayIdx]);

    return { cells, weeks, gridStart: gridStart.toISOString().split('T')[0], heaviestDay, heaviestAvg, dayAvgs };
}

// Build heatmap data for a specific month (for comparison toggle)
export function buildMonthHeatmapData(transactions, year, month) {
    // month is 0-indexed
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const daysInMonth = getDaysInMonth(monthStart);

    const dateMap = {};
    transactions.forEach(t => {
        const d = new Date(t.date || t.created_at);
        if (d < monthStart || d > monthEnd) return;
        const key = d.toISOString().split('T')[0];
        if (!dateMap[key]) dateMap[key] = { amount: 0, count: 0 };
        dateMap[key].amount += parseFloat(t.amount || 0);
        dateMap[key].count += 1;
    });

    // Build grid: rows = days of week, cols = weeks in month
    const startDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1; // Mon=0
    const totalCells = startDayOfWeek + daysInMonth;
    const weeks = Math.ceil(totalCells / 7);

    const cells = [];
    for (let w = 0; w < weeks; w++) {
        for (let d = 0; d < 7; d++) {
            const cellIdx = w * 7 + d;
            const dayOfMonth = cellIdx - startDayOfWeek + 1;
            const date = new Date(year, month, dayOfMonth);
            const key = date.toISOString().split('T')[0];
            const isPadding = dayOfMonth < 1 || dayOfMonth > daysInMonth;
            const isFuture = date > new Date();
            cells.push({
                date: key,
                dayOfWeek: d,
                week: w,
                dayOfMonth,
                isPadding,
                amount: isPadding ? -1 : (dateMap[key]?.amount || 0),
                count: isPadding ? 0 : (dateMap[key]?.count || 0),
                isFuture,
            });
        }
    }

    const amounts = cells.filter(c => !c.isPadding && !c.isFuture && c.amount > 0).map(c => c.amount).sort((a, b) => a - b);
    const getPercentile = (pct) => {
        if (!amounts.length) return 0;
        return amounts[Math.max(0, Math.ceil(amounts.length * pct / 100) - 1)] || 0;
    };
    const p25 = getPercentile(25), p50 = getPercentile(50), p75 = getPercentile(75);
    const getIntensity = (a) => a <= 0 ? 0 : a <= p25 ? 1 : a <= p50 ? 2 : a <= p75 ? 3 : 4;
    cells.forEach(c => { c.intensity = (c.isPadding || c.isFuture) ? -1 : getIntensity(c.amount); });

    const dayAvgs = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);
    cells.filter(c => !c.isPadding && !c.isFuture && c.amount > 0).forEach(c => {
        dayAvgs[c.dayOfWeek] += c.amount;
        dayCounts[c.dayOfWeek]++;
    });
    dayAvgs.forEach((_, i) => { if (dayCounts[i] > 0) dayAvgs[i] /= dayCounts[i]; });

    return { cells, weeks, dayAvgs, dateMap };
}
