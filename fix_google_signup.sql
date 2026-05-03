-- ============================================================
-- FIX: Remove registration_number as auth key
-- Registration number is now just an optional profile attribute.
-- Primary identity is email (from Supabase Auth).
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Add missing columns to profiles table (if not already present)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Remove the UNIQUE constraint & NOT NULL from registration_number
--         so it is just an optional attribute
ALTER TABLE public.profiles
  ALTER COLUMN registration_number DROP NOT NULL;

-- Drop the unique index if it exists
DROP INDEX IF EXISTS idx_profiles_registration_number;

-- Remove unique constraint on registration_number (run only if the constraint exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'u'
    AND conname ILIKE '%registration_number%'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_registration_number_key;
  END IF;
END $$;

-- Step 3: Drop the old trigger & function that required registration_number
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 4: Create a new trigger that works purely on email/name
--         registration_number is left NULL — user fills it in profile settings later
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'Student'
  );
  user_email := NEW.email;

  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (NEW.id, user_email, user_name, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 7: Clean up any legacy PENDING_ or UNKNOWN reg numbers
UPDATE public.profiles
SET registration_number = NULL
WHERE registration_number LIKE 'PENDING_%'
   OR registration_number = 'UNKNOWN';

-- Step 8: Add a non-unique index for lookups (optional, only if you still query by reg_no)
CREATE INDEX IF NOT EXISTS idx_profiles_registration_number
  ON public.profiles(registration_number)
  WHERE registration_number IS NOT NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
