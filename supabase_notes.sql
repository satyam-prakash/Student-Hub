-- Notes Sharing Community - Database Migration (Course Code System)
-- This script safely migrates from the old schema to the new course code schema

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can insert notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

-- Step 2: Drop existing tables (CASCADE will drop triggers automatically)
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.note_categories CASCADE;

-- Step 3: Drop function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 4: Create new notes table with course_code schema
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    course_code TEXT NOT NULL,
    semester TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    thumbnail_url TEXT,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies

-- Anyone can view notes (public read)
CREATE POLICY "Anyone can view notes"
    ON public.notes
    FOR SELECT
    USING (true);

-- Only authenticated users can insert notes
CREATE POLICY "Authenticated users can insert notes"
    ON public.notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own notes (for download count)
CREATE POLICY "Users can update own notes"
    ON public.notes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
    ON public.notes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 7: Create indexes for better performance
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_course_code ON public.notes(course_code);
CREATE INDEX idx_notes_semester ON public.notes(semester);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX idx_notes_downloads ON public.notes(downloads DESC);

-- Step 8: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-update updated_at
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration complete!
-- The notes table now uses course_code and semester instead of subject/category
