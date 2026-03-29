-- 1. BASE EXPENSES TABLE (Already created, but redefining safely)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    wallet TEXT NOT NULL DEFAULT 'Cash',
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. BUDGET SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.expense_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    monthly_budget NUMERIC(10, 2) DEFAULT 0,
    auto_categorize BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_name TEXT NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    saved_amount NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_name TEXT NOT NULL,
    cost_per_month NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on all tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Set up policies
CREATE OR REPLACE FUNCTION setup_policies() RETURNS void AS $$
BEGIN
    -- EXPENSES
    DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
    CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
    CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
    CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
    CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

    -- SETTINGS
    DROP POLICY IF EXISTS "Users can view own settings" ON public.expense_settings;
    CREATE POLICY "Users can view own settings" ON public.expense_settings FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert own settings" ON public.expense_settings;
    CREATE POLICY "Users can insert own settings" ON public.expense_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own settings" ON public.expense_settings;
    CREATE POLICY "Users can update own settings" ON public.expense_settings FOR UPDATE USING (auth.uid() = user_id);

    -- SAVINGS GOALS
    DROP POLICY IF EXISTS "Users can view own goals" ON public.savings_goals;
    CREATE POLICY "Users can view own goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert own goals" ON public.savings_goals;
    CREATE POLICY "Users can insert own goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own goals" ON public.savings_goals;
    CREATE POLICY "Users can update own goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own goals" ON public.savings_goals;
    CREATE POLICY "Users can delete own goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

    -- SUBSCRIPTIONS
    DROP POLICY IF EXISTS "Users can view own subs" ON public.subscriptions;
    CREATE POLICY "Users can view own subs" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert own subs" ON public.subscriptions;
    CREATE POLICY "Users can insert own subs" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own subs" ON public.subscriptions;
    CREATE POLICY "Users can update own subs" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own subs" ON public.subscriptions;
    CREATE POLICY "Users can delete own subs" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql;

SELECT setup_policies();

-- Create trigger to insert settings row for new users
CREATE OR REPLACE FUNCTION public.handle_new_expense_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.expense_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users if not already exists
DROP TRIGGER IF EXISTS on_auth_user_created_expense_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_expense_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_expense_settings();
