import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import { expenseApi } from '../lib/expenseApi';
import { useMediaQuery } from '../utils/useMediaQuery';

import ExpenseCharts from '../components/expenses/ExpenseCharts';
import BudgetStatus from '../components/expenses/BudgetStatus';
import DashboardPanels from '../components/expenses/DashboardPanels';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';

export default function ExpenseTracker() {
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [expenses, setExpenses] = useState([]);
    const [categoriesData, setCategoriesData] = useState([]);
    const [settings, setSettings] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [filters, setFilters] = useState({ category: 'All', wallet: 'All', searchQuery: '' });

    /* Two-tier loading: initial full-screen spinner vs. silent background refresh */
    const [initialLoading, setInitialLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    /* Debounce ref so rapid filter changes only trigger one fetch */
    const refreshTimer = useRef(null);

    /* ── Core fetch (splits initial vs background) ── */
    const loadData = useCallback(async (silent = false) => {
        if (!user) return;
        try {
            const [data, catData, sets, subs, goals] = await Promise.all([
                expenseApi.getExpenses(user.id, filters),
                expenseApi.getExpensesByCategory(user.id),
                expenseApi.getSettings(user.id),
                expenseApi.getSubscriptions(user.id),
                expenseApi.getSavingsGoals(user.id),
            ]);
            setExpenses(data);
            setCategoriesData(catData);
            setSettings(sets);
            setSubscriptions(subs);
            setSavingsGoals(goals);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            if (!silent) setInitialLoading(false);
        }
    }, [user, filters]);

    /* Initial load */
    useEffect(() => {
        setInitialLoading(true);
        loadData(false);
    }, [user]); // deliberately only on user change

    /* Debounced reload on filter change (after initial load) */
    useEffect(() => {
        if (initialLoading) return;
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => loadData(true), 300);
        return () => clearTimeout(refreshTimer.current);
    }, [filters]);

    /* Silent background refresh helper */
    const silentRefresh = useCallback(() => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => loadData(true), 200);
    }, [loadData]);

    /* ── Modal handlers ── */
    const handleOpenModal = (expense = null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    /* ── OPTIMISTIC submit — close instantly, refresh in background ── */
    const handleSubmitExpense = async (formData) => {
        const tempId = `temp_${Date.now()}`;
        const optimisticExpense = {
            id: tempId,
            ...formData,
            amount: parseFloat(formData.amount),
            created_at: new Date().toISOString(),
        };

        if (editingExpense) {
            /* Edit: replace in local list immediately */
            setExpenses(prev => prev.map(e =>
                e.id === editingExpense.id ? { ...e, ...formData, amount: parseFloat(formData.amount) } : e
            ));
        } else {
            /* Add: prepend optimistic row */
            setExpenses(prev => [optimisticExpense, ...prev]);
        }

        /* Close the modal instantly — no waiting */
        handleCloseModal();

        /* Persist to Supabase in the background */
        try {
            if (editingExpense) {
                await expenseApi.updateExpense(editingExpense.id, user.id, formData);
            } else {
                await expenseApi.addExpense({ ...formData, user_id: user.id });
            }
        } catch (error) {
            console.error('Failed to save expense:', error);
            /* Rollback optimistic update on error */
            if (!editingExpense) {
                setExpenses(prev => prev.filter(e => e.id !== tempId));
            }
            alert('Error saving expense. Please try again.');
        }

        /* Refresh category totals & charts silently after write */
        silentRefresh();
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        /* Optimistic delete */
        setExpenses(prev => prev.filter(e => e.id !== id));
        try {
            await expenseApi.deleteExpense(id, user.id);
        } catch (error) {
            console.error('Failed to delete expense:', error);
            silentRefresh(); // re-sync on error
        }
        silentRefresh();
    };

    const handleSearch = (query) => {
        setFilters(prev => ({ ...prev, searchQuery: query }));
    };

    const handleUpdateBudget = async (newAmount) => {
        /* Optimistic settings update */
        setSettings(prev => ({ ...prev, monthly_budget: newAmount }));
        try {
            await expenseApi.updateSettings(user.id, { monthly_budget: newAmount });
        } catch (e) {
            console.error('Failed to update budget:', e);
            alert('Error updating budget.');
            silentRefresh();
        }
    };

    const handleAddSubscription = async (subData) => {
        try {
            await expenseApi.addSubscription({ ...subData, user_id: user.id });
            silentRefresh();
        } catch (e) {
            console.error('Failed to add subscription:', e);
            alert('Error adding subscription.');
        }
    };

    /* ── Initial loading screen ── */
    if (initialLoading) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} className="animate-spin" />
            </div>
        );
    }

    const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const monthlyBudget = settings?.monthly_budget > 0 ? parseFloat(settings.monthly_budget) : 9000;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: isMobile ? '2rem' : '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '2rem' : '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Expense Tracker</h1>
                    <p className="text-secondary">Track, analyse, and optimize your spending</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    <span>Add Expense</span>
                </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: isMobile ? '1.5rem' : '1rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <BudgetStatus totalSpent={totalSpent} monthlyBudget={monthlyBudget} onUpdateBudget={handleUpdateBudget} expenses={expenses} />
            </div>

            <div style={{ display: 'flex', gap: isMobile ? '1.5rem' : '1rem', marginBottom: isMobile ? '2rem' : '1rem', flexWrap: 'wrap' }}>
                <ExpenseCharts categoriesData={categoriesData} expenses={expenses} monthlyBudget={monthlyBudget} />
            </div>

            <DashboardPanels
                settings={settings}
                subscriptions={subscriptions}
                savingsGoals={savingsGoals}
                onAddSubscription={handleAddSubscription}
            />

            <ExpenseList
                expenses={expenses}
                onEdit={handleOpenModal}
                onDelete={handleDeleteExpense}
                onSearch={handleSearch}
                filters={filters}
                setFilters={setFilters}
            />

            <ExpenseFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitExpense}
                initialData={editingExpense}
            />
        </div>
    );
}
