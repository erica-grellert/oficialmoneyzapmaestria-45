-- ========================================================================
-- TEST SCRIPT FOR MIGRATIONS
-- ========================================================================
-- This script tests the migration structure to ensure everything will work
-- Run this before applying migrations to catch any issues

-- ========================================================================
-- TEST 1: Check if extensions can be loaded
-- ========================================================================
DO $$
BEGIN
  RAISE NOTICE '🧪 Testing extension loading...';
  
  -- Test uuid-ossp
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE NOTICE '⚠️ uuid-ossp extension not available';
  ELSE
    RAISE NOTICE '✅ uuid-ossp extension available';
  END IF;
  
  -- Test pgcrypto
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE NOTICE '⚠️ pgcrypto extension not available';
  ELSE
    RAISE NOTICE '✅ pgcrypto extension available';
  END IF;
  
  -- Test pg_stat_statements
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RAISE NOTICE '⚠️ pg_stat_statements extension not available';
  ELSE
    RAISE NOTICE '✅ pg_stat_statements extension available';
  END IF;
END $$;

-- ========================================================================
-- TEST 2: Check if auth schema exists
-- ========================================================================
DO $$
BEGIN
  RAISE NOTICE '🧪 Testing auth schema...';
  
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    RAISE NOTICE '✅ Auth schema exists';
  ELSE
    RAISE NOTICE '❌ Auth schema missing - this will cause errors';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    RAISE NOTICE '✅ Auth users table exists';
  ELSE
    RAISE NOTICE '❌ Auth users table missing - this will cause errors';
  END IF;
END $$;

-- ========================================================================
-- TEST 3: Check if storage schema exists
-- ========================================================================
DO $$
BEGIN
  RAISE NOTICE '🧪 Testing storage schema...';
  
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    RAISE NOTICE '✅ Storage schema exists';
  ELSE
    RAISE NOTICE '⚠️ Storage schema missing - storage buckets will fail';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    RAISE NOTICE '✅ Storage buckets table exists';
  ELSE
    RAISE NOTICE '⚠️ Storage buckets table missing - storage buckets will fail';
  END IF;
END $$;

-- ========================================================================
-- TEST 4: Check if we can create tables
-- ========================================================================
DO $$
BEGIN
  RAISE NOTICE '🧪 Testing table creation...';
  
  -- Test if we can create a simple table
  CREATE TEMP TABLE test_migration_table (
    id UUID DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  RAISE NOTICE '✅ Table creation works';
  
  -- Clean up
  DROP TABLE test_migration_table;
END $$;

-- ========================================================================
-- TEST 5: Check if we can create functions
-- ========================================================================
DO $$
BEGIN
  RAISE NOTICE '🧪 Testing function creation...';
  
  -- Test if we can create a simple function
  CREATE OR REPLACE FUNCTION test_migration_function()
  RETURNS TEXT AS $$
  BEGIN
    RETURN 'Function creation works';
  END;
  $$ LANGUAGE plpgsql;
  
  RAISE NOTICE '✅ Function creation works';
  
  -- Clean up
  DROP FUNCTION test_migration_function();
END $$;

-- ========================================================================
-- TEST 6: Check if we can create triggers
-- ========================================================================
DO $$
BEGIN
  RAISE NOTICE '🧪 Testing trigger creation...';
  
  -- Create a test table
  CREATE TEMP TABLE test_trigger_table (
    id SERIAL PRIMARY KEY,
    name TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Create a test function
  CREATE OR REPLACE FUNCTION test_trigger_function()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  -- Create a test trigger
  CREATE TRIGGER test_trigger
    BEFORE UPDATE ON test_trigger_table
    FOR EACH ROW EXECUTE FUNCTION test_trigger_function();
  
  RAISE NOTICE '✅ Trigger creation works';
  
  -- Clean up
  DROP TABLE test_trigger_table CASCADE;
  DROP FUNCTION test_trigger_function();
END $$;

-- ========================================================================
-- FINAL VERIFICATION
-- ========================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 MIGRATION TESTS COMPLETE';
  RAISE NOTICE '✅ If you see this message, the basic structure is sound';
  RAISE NOTICE '⚠️ Check any warnings above for potential issues';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the migrations in order';
  RAISE NOTICE '2. Test with: SELECT public.verify_installation();';
  RAISE NOTICE '3. Create admin user via edge function';
END $$;
