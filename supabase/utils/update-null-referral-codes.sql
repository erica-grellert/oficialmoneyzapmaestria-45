-- Script to update null referral_code values in moneyzap_users table
-- This script will generate unique referral codes for all users who don't have one

-- First, let's check how many users have null referral codes
SELECT 
    COUNT(*) as total_users,
    COUNT(referral_code) as users_with_referral_code,
    COUNT(*) - COUNT(referral_code) as users_without_referral_code
FROM public.moneyzap_users;

-- Update all users with null referral_code
-- This will use the existing generate_referral_code() function
UPDATE public.moneyzap_users 
SET 
    referral_code = generate_referral_code(),
    updated_at = NOW()
WHERE referral_code IS NULL;

-- Verify the update was successful
SELECT 
    COUNT(*) as total_users,
    COUNT(referral_code) as users_with_referral_code,
    COUNT(*) - COUNT(referral_code) as users_without_referral_code
FROM public.moneyzap_users;

-- Show a sample of the updated referral codes
SELECT 
    id,
    email,
    name,
    referral_code,
    created_at,
    updated_at
FROM public.moneyzap_users 
WHERE referral_code IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- Check for any duplicate referral codes (should be 0)
SELECT 
    referral_code,
    COUNT(*) as count
FROM public.moneyzap_users 
WHERE referral_code IS NOT NULL
GROUP BY referral_code
HAVING COUNT(*) > 1;
