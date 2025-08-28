-- ========================================================================
-- FIX ADMIN USER SETUP
-- ========================================================================
-- This script manually creates the admin user profile and role

-- First, let's check what we have
DO $$
DECLARE
  admin_user_id UUID;
  profile_exists BOOLEAN;
  role_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== CHECKING CURRENT ADMIN STATUS ===';
  
  -- Check if admin user exists in auth.users
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE '❌ Admin user not found in auth.users';
    RAISE NOTICE 'You need to run the create-admin-user edge function first';
    RETURN;
  ELSE
    RAISE NOTICE '✅ Admin user found in auth.users: %', admin_user_id;
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.moneyzap_users WHERE id = admin_user_id) INTO profile_exists;
  RAISE NOTICE 'Profile exists: %', profile_exists;
  
  -- Check if role exists
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin') INTO role_exists;
  RAISE NOTICE 'Admin role exists: %', role_exists;
  
END $$;

-- Now let's fix the issues
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  RAISE NOTICE '=== FIXING ADMIN USER SETUP ===';
  
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE '❌ Cannot proceed: Admin user not found in auth.users';
    RETURN;
  END IF;
  
  -- 1. Create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.moneyzap_users WHERE id = admin_user_id) THEN
    RAISE NOTICE '📝 Creating admin profile...';
    
    INSERT INTO public.moneyzap_users (id, email, full_name)
    VALUES (admin_user_id, 'admin@admin.com', 'Administrator');
    
    RAISE NOTICE '✅ Admin profile created';
  ELSE
    RAISE NOTICE '✅ Admin profile already exists';
  END IF;
  
  -- 2. Create admin role if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin') THEN
    RAISE NOTICE '🔑 Creating admin role...';
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin');
    
    RAISE NOTICE '✅ Admin role created';
  ELSE
    RAISE NOTICE '✅ Admin role already exists';
  END IF;
  
  -- 3. Create default categories if function exists
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_default_categories_for_user') THEN
    RAISE NOTICE '📂 Creating default categories for admin...';
    
    PERFORM public.create_default_categories_for_user(admin_user_id);
    
    RAISE NOTICE '✅ Default categories created';
  ELSE
    RAISE NOTICE '⚠️ create_default_categories_for_user function not found';
  END IF;
  
END $$;

-- Verify the fix
DO $$
DECLARE
  admin_user_id UUID;
  profile_count INTEGER;
  role_count INTEGER;
  categories_count INTEGER;
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
  
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE '❌ Admin user not found - setup incomplete';
    RETURN;
  END IF;
  
  -- Count profile
  SELECT COUNT(*) INTO profile_count FROM public.moneyzap_users WHERE id = admin_user_id;
  RAISE NOTICE 'Admin profiles: %', profile_count;
  
  -- Count roles
  SELECT COUNT(*) INTO role_count FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin';
  RAISE NOTICE 'Admin roles: %', role_count;
  
  -- Count categories
  SELECT COUNT(*) INTO categories_count FROM public.moneyzap_categories WHERE user_id = admin_user_id;
  RAISE NOTICE 'Admin categories: %', categories_count;
  
  -- Final status
  IF profile_count > 0 AND role_count > 0 THEN
    RAISE NOTICE '🎉 ADMIN USER SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'You can now login with: admin@admin.com / admin123';
  ELSE
    RAISE NOTICE '❌ Setup incomplete - check the errors above';
  END IF;
  
END $$;
