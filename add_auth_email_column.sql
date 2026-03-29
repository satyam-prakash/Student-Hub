-- Add auth_email column to profiles table
-- This column stores the regNo@cgpa.app email for authentication
-- while the email column stores the user's real email

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auth_email TEXT;

-- Update existing rows to set auth_email based on registration_number
UPDATE public.profiles
SET auth_email = LOWER(registration_number) || '@cgpa.app'
WHERE auth_email IS NULL AND registration_number IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_email ON public.profiles(auth_email);
