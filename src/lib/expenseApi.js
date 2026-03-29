import { supabase } from './supabase';

export const expenseApi = {
    // ---- EXPENSES ----
    async getExpenses(userId, options = {}) {
        if (!userId) throw new Error('User ID is required');

        let query = supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (options.limit) query = query.limit(options.limit);
        if (options.startDate && options.endDate) {
            query = query.gte('date', options.startDate).lte('date', options.endDate);
        }
        if (options.category && options.category !== 'All') {
            query = query.eq('category', options.category);
        }
        if (options.wallet && options.wallet !== 'All') {
            query = query.eq('wallet', options.wallet);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Custom search filtering if provided (since Supabase textSearch might be tricky with descriptions)
        if (options.searchQuery) {
            const query = options.searchQuery.toLowerCase();
            return data.filter(exp => 
                (exp.description && exp.description.toLowerCase().includes(query)) ||
                (exp.category && exp.category.toLowerCase().includes(query))
            );
        }
        
        return data || [];
    },

    async addExpense(expenseData) {
        if (!expenseData.user_id) throw new Error('User ID is required');
        const { data, error } = await supabase.from('expenses').insert([expenseData]).select().single();
        if (error) throw error;
        return data;
    },

    async updateExpense(id, userId, expenseData) {
        const { data, error } = await supabase.from('expenses').update(expenseData).eq('id', id).eq('user_id', userId).select().single();
        if (error) throw error;
        return data;
    },

    async deleteExpense(id, userId) {
        const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
        return true;
    },
    
    // ---- SETTINGS (Budget & Auto Categorize) ----
    async getSettings(userId) {
        let { data, error } = await supabase.from('expense_settings').select('*').eq('user_id', userId).maybeSingle();
        // If not found, create default
        if (!data) {
            const { data: newData, error: insertError } = await supabase.from('expense_settings').insert([{ user_id: userId }]).select().single();
            if (insertError) throw insertError;
            return newData;
        }
        if (error) throw error;
        return data;
    },

    async updateSettings(userId, settingsData) {
        const { data, error } = await supabase.from('expense_settings').upsert({ user_id: userId, ...settingsData }).select().single();
        if (error) throw error;
        return data;
    },

    // ---- SUBSCRIPTIONS ----
    async getSubscriptions(userId) {
        const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async addSubscription(subsData) {
        const { data, error } = await supabase.from('subscriptions').insert([subsData]).select().single();
        if (error) throw error;
        return data;
    },

    // ---- SAVINGS GOALS ----
    async getSavingsGoals(userId) {
        const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async addSavingsGoal(goalData) {
        const { data, error } = await supabase.from('savings_goals').insert([goalData]).select().single();
        if (error) throw error;
        return data;
    },

    async updateSavingsGoalAmount(id, userId, addedAmount) {
        // Fetch current
        const { data: goal, error: fetchErr } = await supabase.from('savings_goals').select('saved_amount').eq('id', id).eq('user_id', userId).single();
        if (fetchErr) throw fetchErr;

        const newAmount = Number(goal.saved_amount || 0) + Number(addedAmount);

        const { data, error } = await supabase.from('savings_goals')
            .update({ saved_amount: newAmount })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    // Get totals by category for charts
    async getExpensesByCategory(userId, startDate, endDate) {
        const expenses = await this.getExpenses(userId, { startDate, endDate });
        
        const categoryTotals = expenses.reduce((acc, exp) => {
            const amount = parseFloat(exp.amount) || 0;
            acc[exp.category] = (acc[exp.category] || 0) + amount;
            return acc;
        }, {});

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }
};
