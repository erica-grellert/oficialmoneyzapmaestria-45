-- ========================================================================
-- TEST USER ROLES TABLE
-- ========================================================================
-- This script tests the user_roles table to identify any issues

-- Check table structure
DO $$
BEGIN
  RAISE NOTICE '=== TABLE STRUCTURE ===';
  
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    RAISE NOTICE '✅ user_roles table exists';
  ELSE
    RAISE NOTICE '❌ user_roles table does NOT exist';
    RETURN;
  END IF;
  
  -- Check columns
  RAISE NOTICE 'Columns in user_roles:';
  FOR col IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'user_roles' 
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  %: % (nullable: %, default: %)', 
      col.column_name, col.data_type, col.is_nullable, col.column_default;
  END LOOP;
  
END $$;

-- Check table permissions
DO $$
BEGIN
  RAISE NOTICE '=== TABLE PERMISSIONS ===';
  
  -- Check if current user can select
  BEGIN
    PERFORM 1 FROM public.user_roles LIMIT 1;
    RAISE NOTICE '✅ Can SELECT from user_roles';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Cannot SELECT from user_roles: %', SQLERRM;
  END;
  
  -- Check if current user can insert
  BEGIN
    -- Try to insert a test record (we'll delete it immediately)
    INSERT INTO public.user_roles (user_id, role) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'user');
    
    RAISE NOTICE '✅ Can INSERT into user_roles';
    
    -- Clean up test record
    DELETE FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000000';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Cannot INSERT into user_roles: %', SQLERRM;
  END;
  
END $$;

-- Check RLS policies
DO $$
BEGIN
  RAISE NOTICE '=== RLS POLICIES ===';
  
  -- Check if RLS is enabled
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_roles' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS is enabled on user_roles';
  ELSE
    RAISE NOTICE '❌ RLS is NOT enabled on user_roles';
  END IF;
  
  -- List policies
  RAISE NOTICE 'Policies on user_roles:';
  FOR pol IN 
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE tablename = 'user_roles'
  LOOP
    RAISE NOTICE '  Policy: % (permissive: %, cmd: %)', 
      pol.policyname, pol.permissive, pol.cmd;
  END LOOP;
  
END $$;

-- Check enum type
DO $$
BEGIN
  RAISE NOTICE '=== ENUM TYPE CHECK ===';
  
  -- Check if app_role enum exists
  IF EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'app_role'
  ) THEN
    RAISE NOTICE '✅ app_role enum exists';
    
    -- List enum values
    RAISE NOTICE 'Enum values:';
    FOR enum_val IN 
      SELECT unnest(enum_range(NULL::app_role)) as value
    LOOP
      RAISE NOTICE '  %', enum_val.value;
    END LOOP;
  ELSE
    RAISE NOTICE '❌ app_role enum does NOT exist';
  END IF;
  
END $$;

-- Test insert with real data
DO $$
DECLARE
  admin_user_id UUID;
  test_result TEXT;
BEGIN
  RAISE NOTICE '=== TEST INSERT WITH REAL DATA ===';
  
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE '❌ No admin user found in auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Admin user ID: %', admin_user_id;
  
  -- Try to insert admin role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ Successfully inserted admin role';
    
    -- Verify it was inserted
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin') THEN
      RAISE NOTICE '✅ Admin role confirmed in table';
    ELSE
      RAISE NOTICE '❌ Admin role not found after insert';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Failed to insert admin role: %', SQLERRM;
    RAISE NOTICE 'Error detail: %', SQLSTATE;
  END;
  
END $$;

-- Final summary
DO $$
DECLARE
  total_roles INTEGER;
  admin_roles INTEGER;
BEGIN
  RAISE NOTICE '=== FINAL SUMMARY ===';
  
  SELECT COUNT(*) INTO total_roles FROM public.user_roles;
  SELECT COUNT(*) INTO admin_roles FROM public.user_roles WHERE role = 'admin';
  
  RAISE NOTICE 'Total roles in user_roles: %', total_roles;
  RAISE NOTICE 'Admin roles in user_roles: %', admin_roles;
  
  IF admin_roles > 0 THEN
    RAISE NOTICE '🎉 SUCCESS: Admin role exists!';
  ELSE
    RAISE NOTICE '❌ ISSUE: Admin role not found';
  END IF;
  
END $$;
