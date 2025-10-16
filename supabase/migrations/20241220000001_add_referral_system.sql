-- Add referral system fields to moneyzap_users table (only if they don't exist)
DO $$
BEGIN
    -- Add referral_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'moneyzap_users' 
                   AND column_name = 'referral_code') THEN
        ALTER TABLE public.moneyzap_users ADD COLUMN referral_code TEXT UNIQUE;
    END IF;
    
    -- Add referred_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'moneyzap_users' 
                   AND column_name = 'referred_by') THEN
        ALTER TABLE public.moneyzap_users ADD COLUMN referred_by UUID;
    END IF;
    
    -- Add referral_bonus_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'moneyzap_users' 
                   AND column_name = 'referral_bonus_days') THEN
        ALTER TABLE public.moneyzap_users ADD COLUMN referral_bonus_days INTEGER DEFAULT 0;
    END IF;
    
    -- Add referral_bonus_expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'moneyzap_users' 
                   AND column_name = 'referral_bonus_expires_at') THEN
        ALTER TABLE public.moneyzap_users ADD COLUMN referral_bonus_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index for faster referral code lookups (only if they don't exist)
DO $$
BEGIN
    -- Create referral_code index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE schemaname = 'public' 
                   AND tablename = 'moneyzap_users' 
                   AND indexname = 'idx_moneyzap_users_referral_code') THEN
        CREATE INDEX idx_moneyzap_users_referral_code ON public.moneyzap_users(referral_code);
    END IF;
    
    -- Create referred_by index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE schemaname = 'public' 
                   AND tablename = 'moneyzap_users' 
                   AND indexname = 'idx_moneyzap_users_referred_by') THEN
        CREATE INDEX idx_moneyzap_users_referred_by ON public.moneyzap_users(referred_by);
    END IF;
END $$;

-- Add foreign key constraint for referred_by (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'public' 
                   AND table_name = 'moneyzap_users' 
                   AND constraint_name = 'fk_moneyzap_users_referred_by') THEN
        ALTER TABLE public.moneyzap_users 
        ADD CONSTRAINT fk_moneyzap_users_referred_by 
        FOREIGN KEY (referred_by) REFERENCES public.moneyzap_users(id);
    END IF;
END $$;

-- Create a function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code using letters and numbers
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.moneyzap_users WHERE referral_code = code) INTO exists;
        
        -- If code doesn't exist, we can use it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate referral codes for new users
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set referral code if it's not already set
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate referral codes for new users (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_schema = 'public' 
                   AND event_object_table = 'moneyzap_users' 
                   AND trigger_name = 'trigger_set_referral_code') THEN
        CREATE TRIGGER trigger_set_referral_code
            BEFORE INSERT ON public.moneyzap_users
            FOR EACH ROW
            EXECUTE FUNCTION set_referral_code();
    END IF;
END $$;

-- Create a view to track referral statistics
CREATE OR REPLACE VIEW public.referral_stats AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.referral_code,
    u.referral_bonus_days,
    u.referral_bonus_expires_at,
    COUNT(r.id) as total_referrals,
    COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_referrals
FROM public.moneyzap_users u
LEFT JOIN public.moneyzap_users r ON r.referred_by = u.id
GROUP BY u.id, u.email, u.name, u.referral_code, u.referral_bonus_days, u.referral_bonus_expires_at;

-- Grant necessary permissions
GRANT SELECT ON public.referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;
