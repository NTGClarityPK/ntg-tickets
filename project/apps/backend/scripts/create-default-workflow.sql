-- Script to create a system default workflow if none exists
-- This workflow has all basic ticket lifecycle states and transitions

DO $$
DECLARE
    admin_user_id TEXT;
    workflow_exists INT;
    workflow_id TEXT;
BEGIN
    -- Check if any workflows exist
    SELECT COUNT(*) INTO workflow_exists FROM "workflows";
    
    IF workflow_exists = 0 THEN
        RAISE NOTICE 'No workflows found, creating system default workflow...';
        
        -- Get first admin user
        SELECT "id" INTO admin_user_id FROM "users" WHERE 'ADMIN' = ANY("roles") LIMIT 1;
        
        IF admin_user_id IS NULL THEN
            RAISE EXCEPTION 'No admin user found. Please create an admin user first.';
        END IF;
        
        -- Generate a new UUID for the workflow
        workflow_id := gen_random_uuid();
        
        -- Create default workflow
        INSERT INTO "workflows" (
            "id",
            "name",
            "description",
            "status",
            "isDefault",
            "isActive",
            "isSystemDefault",
            "version",
            "definition",
            "createdAt",
            "updatedAt",
            "createdBy"
        ) VALUES (
            workflow_id,
            'Default Workflow',
            'System default workflow for ticket management. This workflow cannot be edited or deleted.',
            'ACTIVE',
            true,
            true,
            true,
            1,
            '{
                "nodes": [
                    {
                        "id": "create",
                        "type": "statusNode",
                        "position": {"x": 50, "y": 100},
                        "data": {"label": "Create Ticket", "color": "#4caf50", "isInitial": true}
                    },
                    {
                        "id": "new",
                        "type": "statusNode",
                        "position": {"x": 250, "y": 100},
                        "data": {"label": "New", "color": "#ff9800"}
                    },
                    {
                        "id": "open",
                        "type": "statusNode",
                        "position": {"x": 450, "y": 100},
                        "data": {"label": "Open", "color": "#2196f3"}
                    },
                    {
                        "id": "in_progress",
                        "type": "statusNode",
                        "position": {"x": 650, "y": 100},
                        "data": {"label": "In Progress", "color": "#9c27b0"}
                    },
                    {
                        "id": "resolved",
                        "type": "statusNode",
                        "position": {"x": 850, "y": 100},
                        "data": {"label": "Resolved", "color": "#4caf50"}
                    },
                    {
                        "id": "closed",
                        "type": "statusNode",
                        "position": {"x": 1050, "y": 100},
                        "data": {"label": "Closed", "color": "#9e9e9e"}
                    }
                ],
                "edges": [
                    {
                        "id": "e0-create",
                        "source": "create",
                        "target": "new",
                        "label": "Create Ticket",
                        "type": "smoothstep",
                        "markerEnd": {"type": "arrowclosed"},
                        "data": {
                            "roles": ["END_USER", "SUPPORT_STAFF", "SUPPORT_MANAGER", "ADMIN"],
                            "conditions": [],
                            "actions": [],
                            "isCreateTransition": true
                        }
                    },
                    {
                        "id": "e1",
                        "source": "new",
                        "target": "open",
                        "label": "Open",
                        "type": "smoothstep",
                        "markerEnd": {"type": "arrowclosed"},
                        "data": {
                            "roles": ["SUPPORT_STAFF", "SUPPORT_MANAGER", "ADMIN"],
                            "conditions": [],
                            "actions": []
                        }
                    },
                    {
                        "id": "e2",
                        "source": "open",
                        "target": "in_progress",
                        "label": "Start Work",
                        "type": "smoothstep",
                        "markerEnd": {"type": "arrowclosed"},
                        "data": {
                            "roles": ["SUPPORT_STAFF", "SUPPORT_MANAGER", "ADMIN"],
                            "conditions": [],
                            "actions": []
                        }
                    },
                    {
                        "id": "e3",
                        "source": "in_progress",
                        "target": "resolved",
                        "label": "Resolve",
                        "type": "smoothstep",
                        "markerEnd": {"type": "arrowclosed"},
                        "data": {
                            "roles": ["SUPPORT_STAFF", "SUPPORT_MANAGER", "ADMIN"],
                            "conditions": [],
                            "actions": []
                        }
                    },
                    {
                        "id": "e4",
                        "source": "resolved",
                        "target": "closed",
                        "label": "Close",
                        "type": "smoothstep",
                        "markerEnd": {"type": "arrowclosed"},
                        "data": {
                            "roles": ["SUPPORT_STAFF", "SUPPORT_MANAGER", "ADMIN"],
                            "conditions": [],
                            "actions": []
                        }
                    },
                    {
                        "id": "e5",
                        "source": "closed",
                        "target": "open",
                        "label": "Reopen",
                        "type": "smoothstep",
                        "markerEnd": {"type": "arrowclosed"},
                        "data": {
                            "roles": ["END_USER", "SUPPORT_STAFF", "SUPPORT_MANAGER", "ADMIN"],
                            "conditions": [],
                            "actions": []
                        }
                    }
                ]
            }'::jsonb,
            NOW(),
            NOW(),
            admin_user_id
        );
        
        RAISE NOTICE 'Successfully created system default workflow with ID: %', workflow_id;
    ELSE
        RAISE NOTICE 'Workflows already exist (count: %). Checking for system default...', workflow_exists;
        
        -- Check if system default exists
        SELECT COUNT(*) INTO workflow_exists FROM "workflows" WHERE "isSystemDefault" = true;
        
        IF workflow_exists = 0 THEN
            RAISE NOTICE 'No system default found, marking oldest workflow as system default...';
            
            UPDATE "workflows"
            SET "isSystemDefault" = true,
                "isDefault" = true,
                "status" = 'ACTIVE'
            WHERE "id" = (
                SELECT "id" FROM "workflows" ORDER BY "createdAt" ASC LIMIT 1
            );
            
            RAISE NOTICE 'Marked oldest workflow as system default';
        ELSE
            RAISE NOTICE 'System default workflow already exists';
        END IF;
    END IF;
END $$;


