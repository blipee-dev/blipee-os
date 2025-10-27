# Human-in-the-Loop (HITL) Implementation Guide

## Overview

The HITL implementation provides a reusable approval system for AI tools that require user confirmation before execution. This is critical for enterprise sustainability applications where certain actions have real-world consequences.

## Architecture

### Components

1. **ToolConfirmation Component** (`/src/components/ai-elements/tool-confirmation.tsx`)
   - Reusable UI component for approval requests
   - Shows tool details, input parameters, and approval controls
   - Supports optional denial reasons
   - Color-coded by severity (critical/medium/low)

2. **Tool Configuration** (`/src/lib/ai/hitl/tool-config.ts`)
   - Centralized configuration for tool approval requirements
   - Defines approval levels (user/admin/owner)
   - Categories (critical/medium/low)
   - Custom approval messages

3. **Approval Logger** (`/src/lib/ai/hitl/approval-logger.ts`)
   - Logs all approvals/denials to database
   - Provides audit trail for compliance
   - Analytics and statistics functions

4. **Database Migration** (`/supabase/migrations/20251026010000_tool_approvals.sql`)
   - Stores approval history
   - Row-level security policies
   - Indexed for performance

## Usage

### Configuring a Tool for HITL

1. **Define Tool Configuration**

Edit `/src/lib/ai/hitl/tool-config.ts`:

```typescript
export const TOOL_APPROVAL_CONFIG: Record<string, ToolApprovalConfig> = {
  submitESGReport: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Submit ESG report to regulatory authority',
    approvalMessage: 'This will submit your ESG report to external regulators. This action cannot be undone.'
  }
};
```

2. **Remove Execute Function from Tool**

In your tool definition, omit the `execute` function for tools requiring approval:

```typescript
// Before (auto-executes)
submitESGReport: tool({
  description: 'Submit ESG report',
  inputSchema: z.object({ ... }),
  execute: async ({ ... }) => {
    return await submitToRegulator(...);
  }
})

// After (requires approval)
submitESGReport: tool({
  description: 'Submit ESG report',
  inputSchema: z.object({ ... }),
  // NO execute function!
})
```

3. **Tool Renders Automatically**

The `ChatInterface` component automatically detects tools requiring approval and renders the `ToolConfirmation` UI.

### Tool Categories

**Critical Tools** (Always require approval)
- ESG report submissions
- Financial transactions (carbon offsets)
- Regulatory filings
- Official target updates

**Medium Tools** (Configurable)
- Supplier communications
- Data modifications
- Schedule external audits

**Low Tools** (Auto-execute)
- Read-only analysis
- Report generation
- Benchmark retrieval

## User Flow

1. **User sends message**: "Submit our Q4 ESG report to GRI"

2. **AI generates tool call**: `submitESGReport({ reportType: 'GRI', period: 'Q4 2024', ... })`

3. **Approval UI appears**:
   ```
   ⚠️ Approval Required: Submit ESG report to regulatory authority

   This will submit your ESG report to external regulators. This action cannot be undone.

   [Show details ▼]

   [✓ Approve & Execute]  [✗ Deny]
   ```

4. **User approves or denies**:
   - **Approve**: Tool executes with logged approval
   - **Deny**: Tool returns error, logged with reason

5. **Conversation continues** with result or denial message

## Database Schema

### Tool Approvals Table

```sql
CREATE TABLE tool_approvals (
  id UUID PRIMARY KEY,
  tool_name TEXT NOT NULL,
  tool_call_id TEXT NOT NULL,
  tool_input JSONB NOT NULL,
  tool_output JSONB,
  approved BOOLEAN NOT NULL,
  denial_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ NOT NULL,
  conversation_id UUID,
  organization_id UUID,
  message_id TEXT,
  model TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL
);
```

## API Functions

### Logging Approvals

```typescript
import { logToolApproval } from '@/lib/ai/hitl/approval-logger';

await logToolApproval({
  toolName: 'submitESGReport',
  toolCallId: 'abc123',
  toolInput: { reportType: 'GRI', ... },
  toolOutput: { success: true, ... },
  approved: true,
  userId: user.id,
  organizationId: org.id,
  conversationId: conv.id
});
```

### Getting Approval History

```typescript
// Get all approvals for a conversation
const approvals = await getConversationApprovals(conversationId);

// Get organization approvals with filters
const orgApprovals = await getOrganizationApprovals(organizationId, {
  toolName: 'submitESGReport',
  approvedOnly: true,
  limit: 10
});

// Get approval statistics
const stats = await getApprovalStats(organizationId);
// Returns: { total, approved, denied, approvalRate, byTool }
```

### Checking Tool Configuration

```typescript
import { requiresApproval, getApprovalConfig } from '@/lib/ai/hitl/tool-config';

// Check if tool needs approval
if (requiresApproval('submitESGReport')) {
  // Show approval UI
}

// Get full configuration
const config = getApprovalConfig('submitESGReport');
console.log(config.approvalMessage);
```

## Security & Compliance

### Row-Level Security

- Users can view their own approvals
- Organization admins can view all approvals for their org
- Authenticated users can insert approvals

### Audit Trail

All approvals are permanently logged with:
- Complete tool input/output
- User who approved/denied
- Timestamp
- Denial reasons (if applicable)
- Conversation context

### Compliance

The approval system ensures:
- ✅ No critical actions without explicit approval
- ✅ Complete audit trail for regulatory review
- ✅ User accountability (who approved what)
- ✅ Transparency (users see what they're approving)

## Testing

### Test Critical Tool

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to chat interface
open http://localhost:3001/(dashboard)/chat

# 3. Send message
"Submit our ESG report to GRI for Q4 2024"

# 4. Verify approval UI appears
# 5. Click "Approve & Execute"
# 6. Verify approval is logged to database
```

### Verify Database Logging

```sql
-- Check recent approvals
SELECT * FROM tool_approvals
ORDER BY created_at DESC
LIMIT 10;

-- Check approval rate for a tool
SELECT
  tool_name,
  COUNT(*) as total,
  SUM(CASE WHEN approved THEN 1 ELSE 0 END) as approved,
  ROUND(100.0 * SUM(CASE WHEN approved THEN 1 ELSE 0 END) / COUNT(*), 2) as approval_rate
FROM tool_approvals
GROUP BY tool_name;
```

## Extending

### Add New Tool

1. Add configuration to `tool-config.ts`
2. Remove `execute` from tool definition
3. Tool automatically requires approval

### Customize UI

Edit `/src/components/ai-elements/tool-confirmation.tsx`:

```typescript
// Add custom fields
// Change colors/styling
// Add additional validation
// Implement multi-step approval
```

### Add Role-Based Approval

```typescript
// In tool-config.ts
export const TOOL_APPROVAL_CONFIG = {
  submitESGReport: {
    requiresApproval: true,
    approvalLevel: 'admin',  // Only admins can approve
    // ...
  }
};

// In ChatInterface, check user role
const canApprove = userRole === config.approvalLevel;
```

## Best Practices

1. **Always require approval for**:
   - External API calls (regulatory submissions, payments)
   - Data modifications (targets, official data)
   - Communications (emails, surveys)
   - Financial transactions

2. **Consider approval for**:
   - Scheduling (audits, meetings)
   - Bulk operations
   - Sensitive data access

3. **Don't require approval for**:
   - Read-only operations
   - Analysis and calculations
   - Report generation
   - Benchmark retrieval

4. **Provide clear approval messages**:
   - Explain what will happen
   - Mention if irreversible
   - Show cost/impact if applicable

## Troubleshooting

### Approval UI Not Showing

- Check tool is in `TOOL_APPROVAL_CONFIG`
- Verify `requiresApproval: true`
- Check `execute` function is removed from tool definition

### Approvals Not Logging

- Verify database migration ran successfully
- Check Supabase connection
- Look for errors in browser console

### Tool Not Executing After Approval

- Check tool result is properly formatted
- Verify `sendMessage()` is called after `addToolResult()`
- Look for errors in API route

## Future Enhancements

- [ ] Multi-step approval workflows (requester → manager → admin)
- [ ] Email/Slack notifications for approval requests
- [ ] Approval delegation
- [ ] Time-limited approvals
- [ ] Bulk approval/denial
- [ ] Approval templates
- [ ] Custom approval forms per tool
