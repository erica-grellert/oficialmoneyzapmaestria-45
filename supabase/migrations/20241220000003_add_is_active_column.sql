-- Add is_active column to moneyzap_users table (only if it doesn't exist)
DO $$
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'moneyzap_users' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE public.moneyzap_users 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

