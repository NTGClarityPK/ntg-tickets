# Workflow Conditions Guide

## Overview
Workflow transitions can now enforce conditions that must be met before allowing a status change. This ensures that required information (like comments or resolutions) is provided during critical transitions.

## Supported Condition Types

### 1. **REQUIRES_COMMENT**
Enforces that a comment must be provided when performing the transition.

**Example Use Cases:**
- Closing a ticket without resolution
- Putting a ticket on hold
- Rejecting a request

**Error Message:** 
"A comment is required to perform this transition. Please provide a reason or note for the status change."

---

### 2. **REQUIRES_RESOLUTION**
Enforces that a resolution description must be provided.

**Example Use Cases:**
- Transitioning to RESOLVED status
- Closing a ticket
- Marking as completed

**Error Message:** 
"A resolution description is required for this transition. Please describe how the issue was resolved."

---

### 3. **REQUIRES_ASSIGNMENT**
Ensures the ticket is assigned to someone before transitioning.

**Example Use Cases:**
- Starting work on a ticket (NEW → IN_PROGRESS)
- Moving to review stage
- Escalating a ticket

**Error Message:** 
"This ticket must be assigned to a team member before this transition can be performed."

---

### 4. **REQUIRES_APPROVAL**
Requires manager or authorized approval before transition.

**Example Use Cases:**
- High-cost solutions
- Critical system changes
- Policy exceptions

**Error Message:** 
"This transition requires approval from a manager or authorized person."

---

### 5. **PRIORITY_HIGH**
Only allows transition if ticket priority is HIGH or CRITICAL.

**Example Use Cases:**
- Fast-track processing
- Escalation paths
- Emergency procedures

**Error Message:** 
"This transition can only be performed on high or critical priority tickets."

---

### 6. **CUSTOM_FIELD_VALUE**
Validates that specific custom fields are filled.

**Example Use Cases:**
- Require root cause before closing
- Require affected systems documented
- Require customer approval reference

**Error Message:** 
"Required field 'X' must be filled before this transition."

---

## How to Configure Conditions in Workflows

### Using the Database (Temporary - UI Coming Soon)

```sql
-- Example: Add "requires comment" condition to ON_HOLD transition
INSERT INTO workflow_transition_conditions (
  "transitionId",
  "type",
  "value",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT 
  wt.id,
  'REQUIRES_COMMENT',
  NULL,
  true,
  NOW(),
  NOW()
FROM workflow_transitions wt
WHERE wt."toState" = 'ON_HOLD';

-- Example: Add "requires resolution" to RESOLVED transition
INSERT INTO workflow_transition_conditions (
  "transitionId",
  "type",
  "value",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT 
  wt.id,
  'REQUIRES_RESOLUTION',
  NULL,
  true,
  NOW(),
  NOW()
FROM workflow_transitions wt
WHERE wt."toState" = 'RESOLVED';

-- Example: Require assignment before IN_PROGRESS
INSERT INTO workflow_transition_conditions (
  "transitionId",
  "type",
  "value",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT 
  wt.id,
  'REQUIRES_ASSIGNMENT',
  NULL,
  true,
  NOW(),
  NOW()
FROM workflow_transitions wt
WHERE wt."toState" = 'IN_PROGRESS';
```

## How It Works

1. **User attempts to change ticket status** via the UI
2. **Backend checks** if workflow transition has any conditions
3. **For each active condition**, validates:
   - `REQUIRES_COMMENT`: Comment parameter is not empty
   - `REQUIRES_RESOLUTION`: Resolution field is filled
   - `REQUIRES_ASSIGNMENT`: Ticket has an assignee
   - etc.
4. **If validation fails**, returns 400 error with clear message
5. **If validation passes**, transition is allowed and:
   - Comment is saved to the ticket (if provided)
   - Resolution is saved (if provided)
   - Status is updated
   - History is recorded

## Testing

### Test REQUIRES_COMMENT:

```bash
# This should FAIL if condition is set
curl -X PATCH http://localhost:3000/api/tickets/{ticketId}/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ON_HOLD"
  }'

# This should SUCCEED
curl -X PATCH http://localhost:3000/api/tickets/{ticketId}/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ON_HOLD",
    "comment": "Waiting for customer response"
  }'
```

### Test REQUIRES_RESOLUTION:

```bash
# This should FAIL if condition is set
curl -X PATCH http://localhost:3000/api/tickets/{ticketId}/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED"
  }'

# This should SUCCEED
curl -X PATCH http://localhost:3000/api/tickets/{ticketId}/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED",
    "resolution": "Fixed by restarting the server"
  }'
```

## Frontend Integration

The frontend needs to be updated to:
1. Fetch transition conditions when loading a ticket
2. Show comment/resolution fields when required
3. Display clear validation messages
4. Prevent submission if required fields are empty

Example UI flow:
```typescript
// When user selects a status
const transition = availableTransitions.find(t => t.to === selectedStatus);
const requiresComment = transition?.conditions?.some(c => c.type === 'REQUIRES_COMMENT');
const requiresResolution = transition?.conditions?.some(c => c.type === 'REQUIRES_RESOLUTION');

// Show appropriate input fields
if (requiresComment) {
  // Show comment textarea with "Required" label
}
if (requiresResolution) {
  // Show resolution textarea with "Required" label
}
```

## Future Enhancements

- [ ] Add UI in workflow editor to configure conditions
- [ ] Add visual indicators in ticket view for required conditions
- [ ] Support for compound conditions (AND/OR logic)
- [ ] Custom error messages per condition
- [ ] Time-based conditions (e.g., must wait 24 hours)
- [ ] Approval workflow integration
- [ ] Custom field validation

