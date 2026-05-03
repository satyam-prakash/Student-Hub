-- Add subcategory column to expenses table
-- Run this migration to add subcategory support

-- Add subcategory column (nullable for backward compatibility)
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Add index for faster filtering by subcategory
CREATE INDEX IF NOT EXISTS idx_expenses_subcategory ON public.expenses(subcategory);

-- Add index for combined category + subcategory queries
CREATE INDEX IF NOT EXISTS idx_expenses_category_subcategory ON public.expenses(category, subcategory);

-- Update any existing "Other" entries to have "Miscellaneous" subcategory (optional)
-- Uncomment if you want to set a default subcategory for existing records
-- UPDATE public.expenses SET subcategory = 'Miscellaneous' WHERE category = 'Other' AND subcategory IS NULL;
