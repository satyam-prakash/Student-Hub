-- ============================================================
-- StudentHub Advanced Features — Supabase SQL Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── WISHLIST ITEMS (Feature 14) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url    TEXT,
  priority     INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  linked_goal_id UUID,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'purchased', 'abandoned')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for wishlist_items
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can update own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist_items;

CREATE POLICY "Users can view own wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist items"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist items"
  ON public.wishlist_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist items"
  ON public.wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- ── INCOME EVENTS (Feature 7 — Cash Flow Timeline) ───────────
CREATE TABLE IF NOT EXISTS public.income_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount               DECIMAL(10, 2) NOT NULL DEFAULT 0,
  source               TEXT NOT NULL DEFAULT 'Pocket Money',
  date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring         BOOLEAN DEFAULT FALSE,
  recurring_day_of_month INTEGER CHECK (recurring_day_of_month BETWEEN 1 AND 31),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for income_events
ALTER TABLE public.income_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own income events" ON public.income_events;
DROP POLICY IF EXISTS "Users can insert own income events" ON public.income_events;
DROP POLICY IF EXISTS "Users can update own income events" ON public.income_events;
DROP POLICY IF EXISTS "Users can delete own income events" ON public.income_events;

CREATE POLICY "Users can view own income events"
  ON public.income_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income events"
  ON public.income_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income events"
  ON public.income_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income events"
  ON public.income_events FOR DELETE
  USING (auth.uid() = user_id);

-- ── USER BADGES (Feature 13) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;

CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── CATEGORY BUDGETS (Feature 11 — Budget Wizard) ─────────────
CREATE TABLE IF NOT EXISTS public.category_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  amount       DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- RLS for category_budgets
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own category budgets" ON public.category_budgets;

CREATE POLICY "Users can manage own category budgets"
  ON public.category_budgets FOR ALL
  USING (auth.uid() = user_id);

-- ── BENCHMARK CACHE (Feature 4 — Peer Benchmarking) ──────────
CREATE TABLE IF NOT EXISTS public.benchmark_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key   TEXT NOT NULL UNIQUE, -- e.g., 'all_students_2024-04'
  data        JSONB NOT NULL, -- Aggregated benchmarks by category
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL -- TTL: 24 hours
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_benchmark_cache_expires 
  ON public.benchmark_cache (expires_at);

-- RLS: Allow all authenticated users to read (no user_id needed, it's aggregated data)
ALTER TABLE public.benchmark_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read benchmark cache" ON public.benchmark_cache;

CREATE POLICY "Authenticated users can read benchmark cache"
  ON public.benchmark_cache FOR SELECT
  TO authenticated
  USING (true);

-- Cleanup function for expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_benchmarks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.benchmark_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── VERIFY EXISTING TABLES HAVE CORRECT COLUMNS ──────────────
-- Check expenses table has 'date' column (required for analytics)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'date'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;
