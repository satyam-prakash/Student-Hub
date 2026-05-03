import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, BarChart2, List, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { expenseApi } from '../lib/expenseApi';
import { useMediaQuery } from '../utils/useMediaQuery';
import { usePersistedState, useScrollRestoration } from '../hooks/usePersistedState';
import { useOfflineSync, addToOfflineQueue } from '../hooks/useOfflineSync';
import { detectAnomalies } from '../utils/analytics';
import { HistoricalAnalyticsProvider, useHistoricalAnalyticsContext } from '../hooks/useHistoricalAnalytics.jsx';

import ExpenseCharts from '../components/expenses/ExpenseCharts';
import BudgetStatus from '../components/expenses/BudgetStatus';
import DashboardPanels from '../components/expenses/DashboardPanels';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import ForecastCard from '../components/expenses/ForecastCard';
import AnomalyAlertBanner from '../components/expenses/AnomalyAlertBanner';
import OfflineStatusBar from '../components/expenses/OfflineStatusBar';
import RecurringSuggestionsPanel from '../components/expenses/RecurringSuggestionsPanel';
import ExportButton from '../components/expenses/ExportButton';
import BudgetWizard from '../components/expenses/BudgetWizard';
import AnalyticsTab from '../components/expenses/AnalyticsTab';
import WishlistPage from '../components/expenses/WishlistPage';
import ResponsiveNavigation from '../components/expenses/ResponsiveNavigation';
import RecentTransactions from '../components/expenses/RecentTransactions';

const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={18} /> },
    { key: 'expenses', label: 'Expenses', icon: <List size={18} /> },
    { key: 'analytics', label: 'Analytics', icon: <Sparkles size={18} /> },
    { key: 'wishlist', label: 'Wishlist', icon: <Star size={18} /> },
];

export default function ExpenseTracker() {
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [activeTab, setActiveTab] = usePersistedState('expense_active_tab', 'dashboard');
    const currentMonthStrOriginal = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonthStr, setSelectedMonthStr] = usePersistedState('expense_selected_month', currentMonthStrOriginal); // 'YYYY-MM'

    // Data
    const [expenses, setExpenses] = usePersistedState('expenses_data', []);
    const [settings, setSettings] = usePersistedState('expenses_settings', null);
    const [subscriptions, setSubscriptions] = usePersistedState('expenses_subscriptions', []);
    const [savingsGoals, setSavingsGoals] = usePersistedState('expenses_savings_goals', []);
    const [filters, setFilters] = usePersistedState('expenses_filters', { category: 'All', wallet: 'All', searchQuery: '' });

    const [initialLoading, setInitialLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showWizard, setShowWizard] = useState(false);
    const refreshTimer = useRef(null);
    const lastFetchTime = useRef(null);

    useScrollRestoration('expense_tracker');

    // Offline sync
    const { isOnline, pendingCount, isSyncing } = useOfflineSync((count) => {
        // On sync complete, refresh
        silentRefresh();
    });

    /* ── Core fetch ── */
    const loadData = useCallback(async (silent = false) => {
        if (!user) return;
        try {
            const [data, sets, subs, goals] = await Promise.all([
                expenseApi.getExpenses(user.id, filters),
                expenseApi.getSettings(user.id),
                expenseApi.getSubscriptions(user.id),
                expenseApi.getSavingsGoals(user.id),
            ]);
            setExpenses(data);
            setSettings(sets);
            setSubscriptions(subs);
            setSavingsGoals(goals);
            lastFetchTime.current = Date.now();
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            if (!silent) setInitialLoading(false);
        }
    }, [user, filters]);

    /* Initial load */
    useEffect(() => {
        const cachedExpenses = sessionStorage.getItem('expenses_data');
        const hasCachedData = cachedExpenses && cachedExpenses !== '[]';
        if (!hasCachedData) setInitialLoading(true);
        else setInitialLoading(false);
        loadData(!!hasCachedData);
    }, [user]);

    /* Debounced reload on filter change */
    useEffect(() => {
        if (initialLoading) return;
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => loadData(true), 300);
        return () => clearTimeout(refreshTimer.current);
    }, [filters]);

    const silentRefresh = useCallback(() => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => loadData(true), 200);
    }, [loadData]);

    /* Stale data refresh on tab visibility */
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                const stale = !lastFetchTime.current || (Date.now() - lastFetchTime.current > 5 * 60 * 1000);
                if (stale) silentRefresh();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user, silentRefresh]);

    /* Show budget wizard on first login */
    useEffect(() => {
        const completed = localStorage.getItem('wizard_completed');
        if (!completed && settings !== null && !settings?.monthly_budget) {
            const t = setTimeout(() => setShowWizard(true), 1500);
            return () => clearTimeout(t);
        }
    }, [settings]);

    /* ── Analytics (memoized) ── */
    // anomalies computed in ExpensesTabAnomalyBanner (has access to historical context)
    const monthlyBudget = settings?.monthly_budget > 0 ? parseFloat(settings.monthly_budget) : 0;
    
    // Filter expenses based on selected month (1st to end of month)
    const currentMonthExpenses = useMemo(() => {
        const [year, month] = selectedMonthStr.split('-').map(Number);
        return expenses.filter(e => {
            const expenseDate = new Date(e.date || e.created_at);
            return expenseDate.getFullYear() === year && expenseDate.getMonth() === month - 1;
        });
    }, [expenses, selectedMonthStr]);
    
    // Total spent THIS MONTH ONLY (not all-time)
    const totalSpent = useMemo(() => 
        currentMonthExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0), 
        [currentMonthExpenses]
    );

    // Compute categories data locally based on current month expenses
    const currentMonthCategoriesData = useMemo(() => {
        const acc = {};
        currentMonthExpenses.forEach(exp => {
            const amount = parseFloat(exp.amount) || 0;
            const cat = exp.category || 'Other';
            acc[cat] = (acc[cat] || 0) + amount;
        });
        return Object.entries(acc)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [currentMonthExpenses]);

    /* Current month save rate for wishlist */
    const saveRate = useMemo(() => {
        if (!monthlyBudget) return 0;
        const monthSpend = currentMonthExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        return Math.max(monthlyBudget - monthSpend, 0);
    }, [currentMonthExpenses, monthlyBudget]);

    /* ── Month Navigation ── */
    const handlePrevMonth = () => {
        const [y, m] = selectedMonthStr.split('-').map(Number);
        const newM = m === 1 ? 12 : m - 1;
        const newY = m === 1 ? y - 1 : y;
        setSelectedMonthStr(`${newY}-${String(newM).padStart(2, '0')}`);
    };
    const handleNextMonth = () => {
        const [y, m] = selectedMonthStr.split('-').map(Number);
        const newM = m === 12 ? 1 : m + 1;
        const newY = m === 12 ? y + 1 : y;
        setSelectedMonthStr(`${newY}-${String(newM).padStart(2, '0')}`);
    };
    
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const formattedMonth = useMemo(() => {
        const [y, m] = selectedMonthStr.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }, [selectedMonthStr]);

    /* ── Modal handlers ── */
    const handleOpenModal = (expense = null) => { setEditingExpense(expense); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingExpense(null); };

    /* ── Optimistic submit ── */
    const handleSubmitExpense = async (formData) => {
        const tempId = `temp_${Date.now()}`;
        const optimisticExpense = { id: tempId, ...formData, amount: parseFloat(formData.amount), created_at: new Date().toISOString(), _pending: !isOnline };

        if (editingExpense) {
            setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, ...formData, amount: parseFloat(formData.amount) } : e));
        } else {
            setExpenses(prev => [optimisticExpense, ...prev]);
        }
        handleCloseModal();

        if (!isOnline) {
            await addToOfflineQueue(editingExpense ? 'update' : 'add', { ...formData, user_id: user.id, id: editingExpense?.id || tempId }).catch(console.error);
            return;
        }

        try {
            if (editingExpense) {
                await expenseApi.updateExpense(editingExpense.id, user.id, formData);
            } else {
                await expenseApi.addExpense({ ...formData, user_id: user.id });
            }
        } catch (error) {
            console.error('Failed to save expense:', error);
            if (!editingExpense) setExpenses(prev => prev.filter(e => e.id !== tempId));
        }
        silentRefresh();
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        setExpenses(prev => prev.filter(e => e.id !== id));
        try {
            await expenseApi.deleteExpense(id, user.id);
        } catch (error) {
            console.error('Failed to delete:', error);
            silentRefresh();
        }
        silentRefresh();
    };

    const handleSearch = (query) => setFilters(prev => ({ ...prev, searchQuery: query }));

    const handleUpdateBudget = async (newAmount) => {
        setSettings(prev => ({ ...prev, monthly_budget: newAmount }));
        try {
            await expenseApi.updateSettings(user.id, { monthly_budget: newAmount });
        } catch (e) {
            console.error('Failed to update budget:', e);
            silentRefresh();
        }
    };

    const handleAddSubscription = async (subData) => {
        try {
            await expenseApi.addSubscription({ ...subData, user_id: user.id });
            silentRefresh();
        } catch (e) { console.error('Failed to add subscription:', e); }
    };

    const handleFilterToCategory = (category) => {
        setFilters(prev => ({ ...prev, category }));
        setActiveTab('expenses');
    };

    /* ── Loading skeleton ── */
    if (initialLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} className="animate-spin" />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading your data...</p>
            </div>
        );
    }

    return (
        <HistoricalAnalyticsProvider userId={user?.id}>
        <>
            {/* Responsive Navigation */}
            <ResponsiveNavigation 
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddExpense={() => setIsModalOpen(true)}
                isMobile={isMobile}
            />

            {/* Main Content Area */}
            <div style={{ 
                marginLeft: isMobile ? 0 : '220px', // Offset for desktop sidebar
                paddingBottom: isMobile ? '90px' : '1rem', // Extra space for mobile bottom bar
                padding: isMobile ? '1rem 1rem 90px' : '1.5rem',
                minHeight: '100vh',
            }}>

                {/* Budget Wizard soft prompt */}
                {!localStorage.getItem('wizard_completed') && settings?.monthly_budget === 0 && !showWizard && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeInUp 0.4s ease' }}>
                        <span style={{ fontSize: '1.2rem' }}>💡</span>
                        <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Set up your smart budget in 2 minutes using the 50/30/20 rule</span>
                        <button onClick={() => setShowWizard(true)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                            Start Wizard
                        </button>
                    </div>
                )}

                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', margin: 0 }}>
                                {TABS.find(t => t.key === activeTab)?.label || 'Expense Tracker'}
                            </h1>
                            {/* Month Picker Control */}
                            {['dashboard', 'analytics'].includes(activeTab) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--surface)', padding: '0.2rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem', color: 'var(--text-secondary)' }}>
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '75px', textAlign: 'center', userSelect: 'none' }}>
                                        {formattedMonth}
                                    </span>
                                    <button 
                                        onClick={handleNextMonth} 
                                        disabled={selectedMonthStr === currentMonthStr}
                                        style={{ background: 'none', border: 'none', cursor: selectedMonthStr === currentMonthStr ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem', color: selectedMonthStr === currentMonthStr ? 'var(--border)' : 'var(--text-secondary)' }}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-secondary" style={{ fontSize: '0.8rem', margin: 0 }}>
                            {isOnline ? '🟢 Live' : '🔴 Offline'}{pendingCount > 0 ? ` · ${pendingCount} pending sync` : ''}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {activeTab === 'expenses' && (
                            <ExportButton expenses={expenses} budget={monthlyBudget} />
                        )}
                        {localStorage.getItem('wizard_completed') && (
                            <button onClick={() => setShowWizard(true)} aria-label="Reconfigure budget wizard"
                                style={{ padding: '0.45rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                                ⚙️ Budget
                        </button>
                    )}
                    {/* Desktop: Add Expense button (mobile has FAB in navigation) */}
                    {!isMobile && (
                        <button className="btn-primary" onClick={() => handleOpenModal()} aria-label="Add new expense"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                            <Plus size={16} />
                            Add Expense
                        </button>
                    )}
                </div>
            </div>

            {/* ═══ DASHBOARD TAB ═══ */}
            {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeInUp 0.3s ease' }}>

                    {/* Hero Metrics Row */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                        <BudgetStatus totalSpent={totalSpent} monthlyBudget={monthlyBudget} onUpdateBudget={handleUpdateBudget} expenses={currentMonthExpenses} />
                        {monthlyBudget > 0 && (
                            <ForecastCard transactions={currentMonthExpenses} budget={monthlyBudget} selectedMonthStr={selectedMonthStr} />
                        )}
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <ExpenseCharts categoriesData={currentMonthCategoriesData} expenses={currentMonthExpenses} monthlyBudget={monthlyBudget} />
                    </div>

                    {/* Recent Transactions */}
                    <RecentTransactions 
                        transactions={expenses}
                        onViewAll={() => setActiveTab('expenses')}
                        onEdit={handleOpenModal}
                        isMobile={isMobile}
                    />

                    {/* Recurring Suggestions */}
                    <RecurringSuggestionsPanel transactions={expenses} onAddSubscription={handleAddSubscription} />

                    {/* Panels */}
                    <DashboardPanels
                        settings={settings}
                        subscriptions={subscriptions}
                        savingsGoals={savingsGoals}
                        onAddSubscription={handleAddSubscription}
                    />
                </div>
            )}

            {/* ═══ EXPENSES TAB ═══ */}
            {activeTab === 'expenses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeInUp 0.3s ease' }}>
                    <ExpensesTabAnomalyBanner expenses={expenses} onFilterToCategory={handleFilterToCategory} />
                    <ExpenseList
                        expenses={expenses}
                        onEdit={handleOpenModal}
                        onDelete={handleDeleteExpense}
                        onSearch={handleSearch}
                        filters={filters}
                        setFilters={setFilters}
                    />
                </div>
            )}

            {/* ═══ ANALYTICS TAB ═══ */}
            {activeTab === 'analytics' && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                    <AnalyticsTab transactions={expenses} budget={monthlyBudget} selectedMonthStr={selectedMonthStr} />
                </div>
            )}

            {/* ═══ WISHLIST TAB ═══ */}
            {activeTab === 'wishlist' && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                    <WishlistPage currentSaveRate={saveRate} />
                </div>
            )}

            {/* Expense Form Modal */}
            <ExpenseFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitExpense}
                initialData={editingExpense}
            />

            {/* Budget Wizard Modal */}
            <BudgetWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onComplete={(budget) => handleUpdateBudget(budget)}
            />

            {/* Offline Status Bar */}
            <OfflineStatusBar isOnline={isOnline} pendingCount={pendingCount} isSyncing={isSyncing} />
            </div>
        </>
        </HistoricalAnalyticsProvider>
    );
}

// Inner component so it can consume the historical context for the Expenses tab anomaly banner
function ExpensesTabAnomalyBanner({ expenses, onFilterToCategory }) {
    const { lastMonth } = useHistoricalAnalyticsContext();
    const anomalies = useMemo(() => detectAnomalies(expenses, lastMonth), [expenses, lastMonth]);
    return <AnomalyAlertBanner anomalies={anomalies} onFilterToCategory={onFilterToCategory} />;
}
