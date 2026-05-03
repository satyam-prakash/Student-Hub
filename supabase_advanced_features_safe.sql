-- ============================================================
-- StudentHub Advanced Features — Supabase SQL Setup (SAFE VERSION)
-- This script is idempotent and can be run multiple times safely
-- ============================================================

-- ── WISHLIST ITEMS (Feature 14) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url    TEXT,
  priority     INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  position     INTEGER DEFAULT 0, -- For drag-drop ordering
  linked_goal_id UUID,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'purchased', 'abandoned')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Add position column if missing (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'position'
  ) THEN
    ALTER TABLE public.wishlist_items ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
END $$;

-- RLS for wishlist_items
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe)
DROP POLICY IF EXISTS "Users can view own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can update own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist_items;

-- Create policies
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
  metadata    JSONB DEFAULT '{}',
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Add metadata column if missing (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_badges' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.user_badges ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

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
  cache_key   TEXT NOT NULL UNIQUE,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_benchmark_cache_expires 
  ON public.benchmark_cache (expires_at);

-- RLS for benchmark_cache
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
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'date'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- ── CREATE INDEXES FOR PERFORMANCE ───────────────────────────

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_status 
  ON public.wishlist_items (user_id, status);

CREATE INDEX IF NOT EXISTS idx_income_events_user_date 
  ON public.income_events (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_user_badges_user 
  ON public.user_badges (user_id);

CREATE INDEX IF NOT EXISTS idx_category_budgets_user 
  ON public.category_budgets (user_id);

-- ============================================================
-- ✅ SETUP COMPLETE!
-- ============================================================
-- All tables created with Row Level Security enabled.
-- This script is safe to run multiple times.
--
-- Next steps:
-- 1. Verify tables in Supabase Table Editor
-- 2. Start your dev server: npm run dev
-- 3. Test the new features in the Analytics tab
-- ============================================================
