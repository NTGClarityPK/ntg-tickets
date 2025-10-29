-- Script to fix multiple active workflows
-- Only the system default should be active, all others should be inactive

DO $$
DECLARE
    system_default_id TEXT;
BEGIN
    -- Find the system default workflow
    SELECT "id" INTO system_default_id FROM "workflows" WHERE "isSystemDefault" = true LIMIT 1;
    
    IF system_default_id IS NOT NULL THEN
        RAISE NOTICE 'Found system default workflow: %', system_default_id;
        
        -- Deactivate all workflows
        UPDATE "workflows" SET "status" = 'INACTIVE' WHERE "status" = 'ACTIVE';
        RAISE NOTICE 'Deactivated all workflows';
        
        -- Activate only the system default
        UPDATE "workflows" SET "status" = 'ACTIVE' WHERE "id" = system_default_id;
        RAISE NOTICE 'Activated system default workflow';
    ELSE
        RAISE NOTICE 'No system default workflow found';
    END IF;
END $$;

-- Show current workflow statuses
SELECT "id", "name", "status", "isSystemDefault", "isDefault" FROM "workflows" ORDER BY "isSystemDefault" DESC, "createdAt" ASC;


