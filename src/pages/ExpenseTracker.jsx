import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import { expenseApi } from '../lib/expenseApi';

import ExpenseStats from '../components/expenses/ExpenseStats';
import ExpenseCharts from '../components/expenses/ExpenseCharts';
import BudgetStatus from '../components/expenses/BudgetStatus';
import DashboardPanels from '../components/expenses/DashboardPanels';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';

export default function ExpenseTracker() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [categoriesData, setCategoriesData] = useState([]);
    
    // New states
    const [settings, setSettings] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [filters, setFilters] = useState({ category: 'All', wallet: 'All', searchQuery: '' });

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await expenseApi.getExpenses(user.id, filters);
            setExpenses(data);

            const catData = await expenseApi.getExpensesByCategory(user.id);
            setCategoriesData(catData);

            const sets = await expenseApi.getSettings(user.id);
            setSettings(sets);
            
            const subs = await expenseApi.getSubscriptions(user.id);
            setSubscriptions(subs);
            
            const goals = await expenseApi.getSavingsGoals(user.id);
            setSavingsGoals(goals);

        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [user, filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenModal = (expense = null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const handleSubmitExpense = async (formData) => {
        try {
            if (editingExpense) {
                await expenseApi.updateExpense(editingExpense.id, user.id, formData);
            } else {
                await expenseApi.addExpense({
                    ...formData,
                    user_id: user.id
                });
            }
            await loadData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save expense:", error);
            alert("Error saving expense.");
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Delete this transaction?")) return;
        try {
            await expenseApi.deleteExpense(id, user.id);
            await loadData();
        } catch (error) {
            console.error("Failed to delete expense:", error);
        }
    };

    const handleSearch = (query) => {
        setFilters(prev => ({ ...prev, searchQuery: query }));
    };

    const handleUpdateBudget = async (newAmount) => {
        try {
            await expenseApi.updateSettings(user.id, { monthly_budget: newAmount });
            await loadData();
        } catch (e) {
            console.error("Failed to update budget:", e);
            alert("Error updating budget.");
        }
    };

    const handleAddSubscription = async (subData) => {
        try {
            await expenseApi.addSubscription({ ...subData, user_id: user.id });
            await loadData();
        } catch (e) {
            console.error("Failed to add subscription:", e);
            alert("Error adding subscription.");
        }
    };

    if (loading && !expenses.length) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} className="animate-spin"></div>
            </div>
        );
    }

    const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const monthlyBudget = settings && settings.monthly_budget > 0 ? parseFloat(settings.monthly_budget) : 9000; // Mock 9000 budget for testing

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Expense Tracker</h1>
                    <p className="text-secondary">Track, analyse, and optimize your spending</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    <span>Add Expense</span>
                </button>
            </div>

            <ExpenseStats expenses={expenses} />

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <ExpenseCharts categoriesData={categoriesData} />
                <BudgetStatus totalSpent={totalSpent} monthlyBudget={monthlyBudget} onUpdateBudget={handleUpdateBudget} />
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
