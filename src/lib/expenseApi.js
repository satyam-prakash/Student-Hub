import { supabase } from './supabase';

export const expenseApi = {
    // ---- EXPENSES ----
    async getExpenses(userId, options = {}) {
        if (!userId) throw new Error('User ID is required');

        let query = supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

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
    },

    // ---- INCOME EVENTS (Feature 7 - Cash Flow Timeline) ----
    async getIncomeEvents(userId) {
        const { data, error } = await supabase
            .from('income_events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async addIncomeEvent(eventData) {
        if (!eventData.user_id) throw new Error('User ID is required');
        const { data, error } = await supabase
            .from('income_events')
            .insert([eventData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateIncomeEvent(id, userId, eventData) {
        const { data, error } = await supabase
            .from('income_events')
            .update(eventData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteIncomeEvent(id, userId) {
        const { error } = await supabase
            .from('income_events')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
        return true;
    },

    // ---- WISHLIST ITEMS (Feature 14 - Wishlist → Goal Pipeline) ----
    async getWishlistItems(userId) {
        const { data, error } = await supabase
            .from('wishlist_items')
            .select('*, savings_goals(*)')
            .eq('user_id', userId)
            .order('position', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async addWishlistItem(itemData) {
        if (!itemData.user_id) throw new Error('User ID is required');
        const { data, error } = await supabase
            .from('wishlist_items')
            .insert([itemData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateWishlistItem(id, userId, itemData) {
        const { data, error } = await supabase
            .from('wishlist_items')
            .update(itemData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteWishlistItem(id, userId) {
        const { error } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
        return true;
    },

    async updateWishlistPositions(userId, items) {
        // Bulk update positions for drag-and-drop
        const updates = items.map((item, index) => ({
            id: item.id,
            user_id: userId,
            position: index,
        }));
        
        const { error } = await supabase
            .from('wishlist_items')
            .upsert(updates);
        if (error) throw error;
        return true;
    },

    // ---- USER BADGES (Feature 13 - Gamification) ----
    async getUserBadges(userId) {
        const { data, error } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', userId)
            .order('earned_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async awardBadge(userId, badgeId, metadata = {}) {
        const { data, error } = await supabase
            .from('user_badges')
            .insert([{
                user_id: userId,
                badge_id: badgeId,
                metadata,
            }])
            .select()
            .single();
        if (error) {
            // Ignore duplicate badge errors (UNIQUE constraint)
            if (error.code === '23505') return null;
            throw error;
        }
        return data;
    },

    // ---- CATEGORY BUDGETS (Feature 11 - Budget Wizard) ----
    async getCategoryBudgets(userId) {
        const { data, error } = await supabase
            .from('category_budgets')
            .select('*')
            .eq('user_id', userId);
        if (error) throw error;
        return data || [];
    },

    async saveCategoryBudgets(userId, budgets) {
        // budgets is array of { category, allocated_amount, min_amount, max_amount }
        const toInsert = budgets.map(b => ({
            user_id: userId,
            ...b,
        }));
        
        const { error } = await supabase
            .from('category_budgets')
            .upsert(toInsert, {
                onConflict: 'user_id,category',
            });
        if (error) throw error;
        return true;
    },

    // ── Monthly Expenditure History ──────────────────────────────
    async getMonthlyHistory(userId, limit = 12) {
        const { data, error } = await supabase
            .from('monthly_expenditure_history')
            .select('*')
            .eq('user_id', userId)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async calculateMonthlyHistory(userId, year, month) {
        const { data, error } = await supabase.rpc('calculate_monthly_expenditure', {
            p_user_id: userId,
            p_year: year,
            p_month: month,
        });
        if (error) throw error;
        return data;
    },
};
