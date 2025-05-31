-- Fix Trigram Extension Issue for Customer Search
-- Run this in Supabase SQL Editor if you get "gin_trgm_ops does not exist" error

-- First, try to enable the trigram extension
DO $$
BEGIN
  -- Try to create the extension (requires superuser privileges)
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  RAISE NOTICE 'pg_trgm extension enabled successfully';
EXCEPTION 
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create pg_trgm extension - insufficient privileges. Contact Supabase support.';
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm extension may not be available in this environment';
END $$;

-- Drop any existing problematic indexes
DROP INDEX IF EXISTS idx_clients_name_search;
DROP INDEX IF EXISTS idx_clients_email_search;
DROP INDEX IF EXISTS idx_clients_phone_search;

-- Try to create trigram indexes, with fallback to basic indexes
DO $$
BEGIN
  -- Check if pg_trgm extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    -- Create trigram indexes for advanced text search
    CREATE INDEX idx_clients_name_search ON clients USING gin (name gin_trgm_ops);
    CREATE INDEX idx_clients_email_search ON clients USING gin (email gin_trgm_ops);
    CREATE INDEX idx_clients_phone_search ON clients USING gin (phone gin_trgm_ops);
    RAISE NOTICE 'Trigram indexes created successfully for advanced text search';
  ELSE
    -- Create basic text indexes as fallback
    CREATE INDEX idx_clients_name_text ON clients (lower(name));
    CREATE INDEX idx_clients_email_text ON clients (lower(email));
    CREATE INDEX idx_clients_phone_text ON clients (phone);
    RAISE NOTICE 'Basic text indexes created (trigram not available)';
  END IF;
EXCEPTION 
  WHEN OTHERS THEN
    -- Final fallback - create simple indexes
    CREATE INDEX IF NOT EXISTS idx_clients_name_simple ON clients (name);
    CREATE INDEX IF NOT EXISTS idx_clients_email_simple ON clients (email);
    CREATE INDEX IF NOT EXISTS idx_clients_phone_simple ON clients (phone);
    RAISE NOTICE 'Simple indexes created as final fallback';
END $$;

-- Verify the indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'clients' 
  AND (indexname LIKE '%search%' 
  OR indexname LIKE '%text%'
  OR indexname LIKE '%simple%')
ORDER BY indexname; 