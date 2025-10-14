-- Add referral system fields to moneyzap_users table
ALTER TABLE public.moneyzap_users 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID,
ADD COLUMN referral_bonus_days INTEGER DEFAULT 0,
ADD COLUMN referral_bonus_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster referral code lookups
CREATE INDEX idx_moneyzap_users_referral_code ON public.moneyzap_users(referral_code);
CREATE INDEX idx_moneyzap_users_referred_by ON public.moneyzap_users(referred_by);

-- Add foreign key constraint for referred_by
ALTER TABLE public.moneyzap_users 
ADD CONSTRAINT fk_moneyzap_users_referred_by 
FOREIGN KEY (referred_by) REFERENCES public.moneyzap_users(id);

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

-- Create a function to process referral bonuses
CREATE OR REPLACE FUNCTION process_referral_bonus(referrer_id TEXT, bonus_days INTEGER DEFAULT 30)
RETURNS BOOLEAN AS $$
DECLARE
    current_bonus_days INTEGER;
    new_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current bonus days and expiry
    SELECT 
        COALESCE(referral_bonus_days, 0),
        COALESCE(referral_bonus_expires_at, NOW())
    INTO current_bonus_days, new_expiry_date
    FROM public.moneyzap_users 
    WHERE id = referrer_id;
    
    -- If current bonus hasn't expired, extend it
    IF new_expiry_date > NOW() THEN
        new_expiry_date := new_expiry_date + (bonus_days || ' days')::INTERVAL;
    ELSE
        -- If expired or no bonus, start from now
        new_expiry_date := NOW() + (bonus_days || ' days')::INTERVAL;
    END IF;
    
    -- Update the referrer's bonus
    UPDATE public.moneyzap_users 
    SET 
        referral_bonus_days = current_bonus_days + bonus_days,
        referral_bonus_expires_at = new_expiry_date,
        updated_at = NOW()
    WHERE id = referrer_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
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

CREATE TRIGGER trigger_set_referral_code
    BEFORE INSERT ON public.moneyzap_users
    FOR EACH ROW
    EXECUTE FUNCTION set_referral_code();

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
GRANT EXECUTE ON FUNCTION process_referral_bonus(TEXT, INTEGER) TO authenticated;
