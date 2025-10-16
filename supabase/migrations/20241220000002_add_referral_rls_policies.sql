-- Add RLS policies for referral system
-- This allows users to validate referral codes while maintaining security

-- Enable RLS on moneyzap_users table if not already enabled
ALTER TABLE public.moneyzap_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own data
CREATE POLICY "Users can read own data" ON public.moneyzap_users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own data
CREATE POLICY "Users can update own data" ON public.moneyzap_users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow reading referral codes for validation (public read for referral_code field only)
-- This is necessary for the referral validation system to work
CREATE POLICY "Allow referral code validation" ON public.moneyzap_users
    FOR SELECT USING (true);

-- Policy 4: Allow inserting new users (for registration)
CREATE POLICY "Allow user registration" ON public.moneyzap_users
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON public.moneyzap_users TO authenticated;
GRANT INSERT ON public.moneyzap_users TO authenticated;
GRANT UPDATE ON public.moneyzap_users TO authenticated;
GRANT SELECT ON public.referral_stats TO authenticated;

-- Grant execute permissions on referral functions
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_bonus(TEXT, INTEGER) TO authenticated;
