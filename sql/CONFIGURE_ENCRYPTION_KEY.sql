-- ============================================================================
-- CONFIGURE ENCRYPTION KEY SCRIPT
-- ============================================================================
-- Version: Production v2.1.1
-- Description: Configure encryption key for the security functions
-- 
-- Usage: Run this to set up encryption key before using encryption functions
-- ============================================================================

-- ============================================================================
-- STEP 1: GENERATE AND SET ENCRYPTION KEY
-- ============================================================================

DO $$
DECLARE
    encryption_key TEXT;
BEGIN
    RAISE NOTICE '🔑 Configuring encryption key...';
    
    -- Check if encryption key is already configured
    BEGIN
        encryption_key := current_setting('app.encryption_key', false);
        RAISE NOTICE '✅ Encryption key already configured: %', substring(encryption_key, 1, 8) || '...';
    EXCEPTION WHEN OTHERS THEN
        -- Generate a secure 32-character encryption key
        -- In production, you should use your own secure key
        encryption_key := 'LP_' || encode(gen_random_bytes(15), 'hex');
        
        -- Set the encryption key in database configuration
        EXECUTE format('ALTER DATABASE %I SET app.encryption_key = %L', current_database(), encryption_key);
        
        RAISE NOTICE '🔑 New encryption key configured: %', substring(encryption_key, 1, 8) || '...';
        RAISE NOTICE '⚠️  IMPORTANT: Save this key securely! Key: %', encryption_key;
        RAISE NOTICE '⚠️  In production, replace with your own secure 32+ character key';
    END;
END $$;

-- ============================================================================
-- STEP 2: VERIFY ENCRYPTION KEY CONFIGURATION
-- ============================================================================

DO $$
DECLARE
    encryption_key TEXT;
    key_length INTEGER;
BEGIN
    RAISE NOTICE '🧪 Verifying encryption key configuration...';
    
    -- Get the encryption key
    BEGIN
        encryption_key := current_setting('app.encryption_key', false);
        key_length := length(encryption_key);
        
        IF key_length >= 32 THEN
            RAISE NOTICE '✅ Encryption key length is secure: % characters', key_length;
        ELSE
            RAISE WARNING '⚠️  Encryption key is shorter than recommended 32 characters: %', key_length;
        END IF;
        
        RAISE NOTICE '✅ Encryption key is properly configured and accessible';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Failed to retrieve encryption key: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- STEP 3: TEST ENCRYPTION FUNCTIONS (if they exist)
-- ============================================================================

DO $$
DECLARE
    test_data TEXT := 'test_encryption_data';
    encrypted_result TEXT;
    decrypted_result TEXT;
BEGIN
    -- Check if encryption functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'encrypt_sensitive_data') THEN
        RAISE NOTICE '🧪 Testing encryption functions...';
        
        BEGIN
            -- Test encryption
            encrypted_result := encrypt_sensitive_data(test_data);
            RAISE NOTICE '✅ Encryption test successful: %', substring(encrypted_result, 1, 20) || '...';
            
            -- Test decryption (if function exists)
            IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrypt_sensitive_data') THEN
                decrypted_result := decrypt_sensitive_data(encrypted_result);
                
                IF decrypted_result = test_data THEN
                    RAISE NOTICE '✅ Decryption test successful: data matches original';
                ELSE
                    RAISE WARNING '⚠️  Decryption test failed: data does not match';
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '⚠️  Encryption function test failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ℹ️  Encryption functions not yet deployed - key is ready for when they are';
    END IF;
END $$;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '🔑 ENCRYPTION KEY CONFIGURATION COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Status: Encryption key is configured and ready for use';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Deploy encryption functions (run SECURITY_ENCRYPTION_MIGRATION.sql)';
    RAISE NOTICE '2. Test encryption/decryption in your application';
    RAISE NOTICE '3. Update application code to use encryption functions';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '🛡️ Your database is ready for secure encryption! 🛡️';
    RAISE NOTICE '============================================================================';
END $$; 