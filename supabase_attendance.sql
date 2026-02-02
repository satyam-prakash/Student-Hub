-- Create table for Attendance Data (Preserving existing table)
create table if not exists attendance_data (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  reg_no text not null,
  subjects jsonb default '[]'::jsonb,
  schedule jsonb default '{}'::jsonb,
  holidays jsonb default '[]'::jsonb,
  last_date text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id)
);

-- Enable RLS for Attendance Data
alter table attendance_data enable row level security;

create policy "Users can view their own attendance data"
  on attendance_data for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own attendance data"
  on attendance_data for all
  using (auth.uid() = user_id);


-- NEW SCHEMA FROM USER REQUEST --

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    registration_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Create policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create the student_cgpa_data table if it doesn't exist (or ensure it exists for the alter below)
CREATE TABLE IF NOT EXISTS student_cgpa_data (
    id BIGSERIAL PRIMARY KEY,
    registration_number TEXT UNIQUE NOT NULL,
    cgpa NUMERIC(5, 2),
    current_term INTEGER,
    term_variant TEXT,
    terms_data JSONB NOT NULL,
    total_credits NUMERIC(6, 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update student_cgpa_data table to link with authenticated users
-- First, check if user_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_cgpa_data' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.student_cgpa_data ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on student_cgpa_data if not already enabled
ALTER TABLE public.student_cgpa_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations" ON public.student_cgpa_data;
DROP POLICY IF EXISTS "Users can view own data" ON public.student_cgpa_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.student_cgpa_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.student_cgpa_data;
DROP POLICY IF EXISTS "Users can delete own data" ON public.student_cgpa_data;

-- Create policies for student_cgpa_data
CREATE POLICY "Users can view own data"
    ON public.student_cgpa_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
    ON public.student_cgpa_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
    ON public.student_cgpa_data FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
    ON public.student_cgpa_data FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, registration_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'registration_number', 'UNKNOWN')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp on profile updates
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.student_cgpa_data TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_registration_number ON public.profiles(registration_number);
CREATE INDEX IF NOT EXISTS idx_student_cgpa_data_user_id ON public.student_cgpa_data(user_id);
CREATE INDEX IF NOT EXISTS idx_student_cgpa_data_registration_number ON public.student_cgpa_data(registration_number);

-- Add results column to attendance_data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_data' AND column_name = 'results'
    ) THEN
        ALTER TABLE public.attendance_data ADD COLUMN results JSONB DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_data' AND column_name = 'today_included'
    ) THEN
        ALTER TABLE public.attendance_data ADD COLUMN today_included BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
