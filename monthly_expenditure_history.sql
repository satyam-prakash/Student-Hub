-- ============================================================
-- Monthly Expenditure History - Track spending history by month
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── MONTHLY EXPENDITURE HISTORY ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.monthly_expenditure_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_spent     DECIMAL(10, 2) NOT NULL DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  category_breakdown JSONB DEFAULT '{}', -- { "Food": 1500, "Transport": 800, ... }
  wallet_breakdown   JSONB DEFAULT '{}', -- { "Cash": 1200, "UPI": 1100, ... }
  budget_set      DECIMAL(10, 2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_monthly_expenditure_user_date 
  ON public.monthly_expenditure_history (user_id, year DESC, month DESC);

-- RLS for monthly_expenditure_history
ALTER TABLE public.monthly_expenditure_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expenditure history" ON public.monthly_expenditure_history;
DROP POLICY IF EXISTS "Users can insert own expenditure history" ON public.monthly_expenditure_history;
DROP POLICY IF EXISTS "Users can update own expenditure history" ON public.monthly_expenditure_history;

CREATE POLICY "Users can view own expenditure history"
  ON public.monthly_expenditure_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenditure history"
  ON public.monthly_expenditure_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenditure history"
  ON public.monthly_expenditure_history FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Function to calculate and store monthly expenditure
-- Call this at the end of each month or on-demand
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_monthly_expenditure(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS void AS $$
DECLARE
  v_total_spent DECIMAL(10, 2);
  v_transaction_count INTEGER;
  v_category_breakdown JSONB;
  v_wallet_breakdown JSONB;
  v_budget DECIMAL(10, 2);
BEGIN
  -- Calculate total spent
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO v_total_spent, v_transaction_count
  FROM public.expenses
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM date) = p_year
    AND EXTRACT(MONTH FROM date) = p_month;

  -- Calculate category breakdown
  SELECT COALESCE(
    jsonb_object_agg(category, total),
    '{}'::jsonb
  )
  INTO v_category_breakdown
  FROM (
    SELECT category, SUM(amount) as total
    FROM public.expenses
    WHERE user_id = p_user_id
      AND EXTRACT(YEAR FROM date) = p_year
      AND EXTRACT(MONTH FROM date) = p_month
    GROUP BY category
  ) cat;

  -- Calculate wallet breakdown
  SELECT COALESCE(
    jsonb_object_agg(wallet, total),
    '{}'::jsonb
  )
  INTO v_wallet_breakdown
  FROM (
    SELECT wallet, SUM(amount) as total
    FROM public.expenses
    WHERE user_id = p_user_id
      AND EXTRACT(YEAR FROM date) = p_year
      AND EXTRACT(MONTH FROM date) = p_month
    GROUP BY wallet
  ) wal;

  -- Get budget setting (uses expense_settings table)
  SELECT COALESCE(monthly_budget, 0)
  INTO v_budget
  FROM public.expense_settings
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Insert or update
  INSERT INTO public.monthly_expenditure_history (
    user_id, year, month, total_spent, transaction_count,
    category_breakdown, wallet_breakdown, budget_set, updated_at
  )
  VALUES (
    p_user_id, p_year, p_month, v_total_spent, v_transaction_count,
    v_category_breakdown, v_wallet_breakdown, v_budget, NOW()
  )
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    total_spent = EXCLUDED.total_spent,
    transaction_count = EXCLUDED.transaction_count,
    category_breakdown = EXCLUDED.category_breakdown,
    wallet_breakdown = EXCLUDED.wallet_breakdown,
    budget_set = EXCLUDED.budget_set,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Automatic trigger to update current month's history on expense change
-- ============================================================
CREATE OR REPLACE FUNCTION update_monthly_history_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current month's history when expense is added/modified/deleted
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_monthly_expenditure(
      OLD.user_id,
      EXTRACT(YEAR FROM OLD.date)::INTEGER,
      EXTRACT(MONTH FROM OLD.date)::INTEGER
    );
  ELSE
    PERFORM calculate_monthly_expenditure(
      NEW.user_id,
      EXTRACT(YEAR FROM NEW.date)::INTEGER,
      EXTRACT(MONTH FROM NEW.date)::INTEGER
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS expenses_monthly_history_trigger ON public.expenses;

-- Create trigger
CREATE TRIGGER expenses_monthly_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_history_trigger();

-- ============================================================
-- ✅ SETUP COMPLETE!
-- ============================================================
-- Automatically tracks monthly expenditure history
-- Updates in real-time when expenses are added/edited/deleted
--
-- To manually calculate history for a specific month:
-- SELECT calculate_monthly_expenditure(
--   'user-uuid'::uuid, 
--   2026, 
--   3
-- );
-- ============================================================
