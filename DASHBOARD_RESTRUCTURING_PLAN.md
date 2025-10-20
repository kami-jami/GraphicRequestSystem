# Dashboard Restructuring: Action-Only Views

## Problem Statement

**Current Issue:** Users see ALL requests they have permission to view, not just those requiring their action. This creates clutter and makes it hard to focus on actionable items.

**Required Behavior:** Each user's main dashboard/inbox should ONLY show requests that currently require their action.

## Proposed Dashboard Structure

### 1. Requester Dashboard

**Main View ("My Requests"):**
- Shows requests they submitted
- Displays current status for tracking
- **NOT** filtered by action - this is a tracking/monitoring view

**Sections:**
- **📥 Need My Action** (ActionRequired)
  - Status 2 (PendingCorrection) - Needs fixes from requester
  - Shows with unread indicators
  
- **📤 In Progress** (InfoOnly - Monitoring)
  - Status 0 (Submitted) - Waiting for admin
  - Status 1 (DesignerReview) - Assigned to designer
  - Status 3 (DesignInProgress) - Designer working
  - Status 4 (PendingApproval) - Waiting for approval
  - Status 5 (PendingRedesign) - Designer redesigning
  - Shows without unread indicators
  
- **✅ Completed**
  - Status 6 (Completed)
  - Archive view

### 2. Designer Dashboard

**Main View ("My Work"):**
- Shows ONLY requests assigned to them that need action
- Excludes requests they've completed and are waiting on others

**Sections:**
- **📥 Need My Action** (ActionRequired)
  - Status 1 (DesignerReview) - Need to start design
  - Status 5 (PendingRedesign) - Need to redesign
  - Shows with unread indicators
  
- **📤 In Progress** (InfoOnly - Monitoring)
  - Status 3 (DesignInProgress) - Currently working
  - Status 4 (PendingApproval) - Sent for approval, waiting
  - Shows without unread indicators (they completed, just monitoring)
  
- **✅ Completed**
  - Status 6 (Completed)
  - Archive view

### 3. Approver/Manager Dashboard

**Main View ("Approvals"):**
- Shows ONLY requests requiring approval
- Clean, focused action list

**Sections:**
- **📥 Need My Approval** (ActionRequired)
  - Status 4 (PendingApproval) - Assigned to them
  - Shows with unread indicators
  
- **✅ Approved**
  - Status 6 (Completed) - Requests they approved
  - Archive view

### 4. Admin Dashboard

**Main View ("Queue"):**
- Shows requests needing assignment
- System-wide monitoring

**Sections:**
- **📥 Need Assignment** (ActionRequired)
  - Status 0 (Submitted) - Need to assign designer
  - Shows with unread indicators
  
- **📊 All Active Requests** (Monitoring)
  - All non-completed requests
  - System overview for monitoring

### 5. Notifications Panel (All Users)

**Separate from Main Inbox:**
- Shows ALL status changes for requests user is involved with
- InfoOnly updates appear here
- User can click to view details
- Doesn't clutter main action inbox

**Example:**
- Designer completes work → Notification appears for Designer
- Designer's main inbox doesn't show it as unread (no action needed)
- Notification says "You completed Request #123, sent for approval"

## Current vs Proposed Implementation

### Current State

**Backend (`GetRequests`):**
- Returns ALL requests user has permission to see
- Applies `IsUnread` logic to mark ActionRequired items
- Doesn't filter by action requirement

**Frontend (Navigation):**
- Groups by status combinations
- Shows all requests in those statuses
- Mixes ActionRequired and InfoOnly items

### Proposed Changes

**Backend - NEW Endpoint (`GetActionRequiredRequests`):**
```csharp
[HttpGet("action-required")]
public async Task<IActionResult> GetActionRequiredRequests()
{
    // Returns ONLY requests where:
    // IsResponsibleUser(userId, ...) == true
    // AND request status matches their responsibility
}
```

**Backend - UPDATE Existing (`GetRequests`):**
```csharp
// Add optional filter parameter
[HttpGet]
public async Task<IActionResult> GetRequests(
    [FromQuery] bool actionRequiredOnly = false)
{
    // If actionRequiredOnly == true:
    //   Filter to only return requests where IsResponsibleUser == true
    // Otherwise:
    //   Return all visible requests (current behavior)
}
```

**Frontend - Update Navigation:**
```tsx
// Requester inbox items
{
    text: '📥 Need My Action',
    statuses: [2], // Only PendingCorrection
    actionRequiredOnly: true,
    countKey: 'requester_needsAction'
},
{
    text: '📤 In Progress',
    statuses: [0, 1, 3, 4, 5], // All except correction and completed
    actionRequiredOnly: false, // Show all for monitoring
    countKey: 'requester_inProgress'
}

// Designer inbox items
{
    text: '📥 Need My Action',
    statuses: [1, 5], // DesignerReview, PendingRedesign
    actionRequiredOnly: true,
    countKey: 'designer_needsAction'
},
{
    text: '📤 In Progress',
    statuses: [3, 4], // DesignInProgress, PendingApproval
    actionRequiredOnly: false, // Show all for monitoring
    countKey: 'designer_inProgress'
}

// Approver inbox items
{
    text: '📥 Need My Approval',
    statuses: [4], // PendingApproval
    actionRequiredOnly: true,
    countKey: 'approver_needsApproval'
}
```

## Implementation Plan

### Phase 1: Backend Filter Parameter

**File:** `RequestsController.cs`

Add optional `actionRequiredOnly` parameter to `GetRequests`:

```csharp
[HttpGet]
public async Task<IActionResult> GetRequests(
    [FromQuery] int[]? statuses, 
    [FromQuery] string? searchTerm, 
    [FromQuery] string? inboxCategory,
    [FromQuery] bool actionRequiredOnly = false) // NEW
{
    // ... existing logic ...
    
    // After calculating IsUnread, filter if requested
    if (actionRequiredOnly)
    {
        requestsWithUnread = requestsWithUnread
            .Where(r => r.IsUnread) // Only keep ActionRequired items
            .ToList();
    }
    
    // ... rest of method ...
}
```

### Phase 2: Frontend Query Parameter

**File:** `apiSlice.ts`

Update `getRequests` to accept `actionRequiredOnly`:

```typescript
getRequests: builder.query<any[], GetRequestsParams & { actionRequiredOnly?: boolean }>({
    query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.statuses && params.statuses.length > 0) {
            params.statuses.forEach(status => 
                queryParams.append('statuses', status.toString()));
        }
        if (params.searchTerm)
            queryParams.append('searchTerm', params.searchTerm);
        if (params.inboxCategory)
            queryParams.append('inboxCategory', params.inboxCategory);
        if (params.actionRequiredOnly) // NEW
            queryParams.append('actionRequiredOnly', 'true');
        return `/requests?${queryParams.toString()}`;
    },
    // ... rest ...
})
```

### Phase 3: Update Navigation Structure

**File:** `MainLayout.tsx`

Add `actionRequiredOnly` property to inbox items:

```tsx
interface InboxItem {
    text: string;
    icon: React.ReactNode;
    inboxType: 'inbox' | 'outbox' | 'completed' | 'all';
    statuses?: number[];
    countKey?: string;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    description?: string;
    actionRequiredOnly?: boolean; // NEW
}

// Requester items
{
    text: '📥 Need My Action',
    icon: <ErrorOutlineIcon fontSize="small" />,
    inboxType: 'inbox',
    statuses: [2],
    countKey: 'requester_needsAction',
    actionRequiredOnly: true, // ONLY show ActionRequired
    color: 'error'
},
{
    text: '📤 Tracking',
    icon: <SendIcon fontSize="small" />,
    inboxType: 'outbox',
    statuses: [0, 1, 3, 4, 5],
    actionRequiredOnly: false, // Show all for monitoring
    color: 'info'
}
```

### Phase 4: Update RequestsListPage

**File:** `RequestsListPage.tsx`

Pass `actionRequiredOnly` to query:

```tsx
const { data: requests, isLoading } = useGetRequestsQuery({
    statuses: statusFilter,
    searchTerm: searchTerm,
    inboxCategory: inboxCategory,
    actionRequiredOnly: inboxType === 'inbox' // NEW
});
```

## Example User Flows

### Flow 1: Designer Workflow

**Scenario:** Designer is assigned a new request

**Before (Cluttered):**
```
Designer's Inbox:
- Request #123 (Status 1 - DesignerReview) → UNREAD (action)
- Request #122 (Status 3 - DesignInProgress) → UNREAD (no action, bug)
- Request #121 (Status 4 - PendingApproval) → UNREAD (no action, bug)
Total: 3 unread (confusing!)
```

**After (Clean):**
```
Designer's "Need My Action" Inbox:
- Request #123 (Status 1 - DesignerReview) → UNREAD
Total: 1 unread (clear!)

Designer's "In Progress" View:
- Request #122 (Status 3 - DesignInProgress) → READ (monitoring)
- Request #121 (Status 4 - PendingApproval) → READ (monitoring)
Total: 0 unread (these are just for tracking)
```

### Flow 2: Requester Workflow

**Scenario:** Requester submits request, designer returns it for corrections

**Before:**
```
Requester's Inbox:
- Request #124 (Status 0 - Submitted) → UNREAD (bug - they submitted it)
- Request #125 (Status 2 - PendingCorrection) → UNREAD (action - correct)
Total: 2 unread (confusing which needs action)
```

**After:**
```
Requester's "Need My Action" Inbox:
- Request #125 (Status 2 - PendingCorrection) → UNREAD
Total: 1 unread (clear!)

Requester's "Tracking" View:
- Request #124 (Status 0 - Submitted) → READ (monitoring)
Total: 0 unread (just tracking progress)
```

### Flow 3: Approver Workflow

**Scenario:** Designer sends work for approval

**Before:**
```
Approver's View:
- All requests in system (Admin role) → Many unread (confusing)
- OR only Status 4 requests → Some are other approvers' (confusing)
```

**After:**
```
Approver's "Need My Approval" Inbox:
- Request #126 (Status 4 - PendingApproval, ApproverId = me) → UNREAD
Total: 1 unread (clear!)

Other approver's requests don't show up at all.
```

## Benefits

### 1. Cleaner Dashboards
✅ Users see only what needs their action
✅ No clutter from monitoring items
✅ Easy to prioritize work

### 2. Clear Separation
✅ **Action Inbox**: Items requiring immediate action
✅ **Tracking/Monitoring**: Items to watch but not act on
✅ **Notifications**: All updates, separate from inbox

### 3. Better UX
✅ Unread count = "You have X things to do"
✅ No false alarms
✅ Focused workflow

### 4. Role-Specific Views
✅ Designer sees design work only
✅ Approver sees approval work only
✅ Requester sees correction work + tracking
✅ Admin sees assignment work + monitoring

## Migration Path

### Step 1: Backend Changes
1. Add `actionRequiredOnly` parameter to `GetRequests`
2. Filter results when `actionRequiredOnly = true`
3. Test with Postman/Swagger

### Step 2: Frontend API Layer
1. Update `GetRequestsParams` interface
2. Add `actionRequiredOnly` to query string builder
3. Update TypeScript types

### Step 3: Navigation Updates
1. Add `actionRequiredOnly` property to `InboxItem`
2. Restructure inbox items per role
3. Update labels ("Need My Action" vs "Tracking")

### Step 4: Page Component Updates
1. Update `RequestsListPage` to pass `actionRequiredOnly`
2. Update `DashboardPage` cards to use new structure
3. Test each role's view

### Step 5: Testing
1. Test as Requester (action vs tracking)
2. Test as Designer (action vs in-progress)
3. Test as Approver (only assigned approvals)
4. Test as Admin (assignments vs monitoring)

## Database Impact

**NO schema changes required!**

All filtering happens in-memory after fetching:
- `IsResponsibleUser` determines action requirement
- `actionRequiredOnly` parameter filters results
- Existing `RequestView` tracks views as before

## Performance Considerations

**Minimal Impact:**
- Same database queries as before
- Additional in-memory filter (very fast)
- No N+1 queries
- Same caching strategy

**Optimization:**
- Could create database view for ActionRequired requests
- Could add computed column for ResponsibleUserId
- Not needed unless performance becomes an issue

## Configuration

**No configuration needed:**
- Logic is hardcoded in `IsResponsibleUser`
- Navigation structure defined in code
- Can be made configurable later if needed

## Future Enhancements

1. **Saved Filters**: Let users save custom views
2. **Smart Views**: "Urgent", "Overdue", "This Week"
3. **Bulk Actions**: Select multiple action items, process together
4. **Delegation**: Temporarily assign action items to others
5. **Workload Balancing**: See team's action queue, redistribute

## Summary

This restructuring provides:

✅ **Clean Separation**: Action items vs Monitoring items
✅ **Role-Specific**: Each user sees what's relevant to them
✅ **No Clutter**: Unread counts are meaningful
✅ **Better Workflow**: Easy to see what needs doing
✅ **Backward Compatible**: Existing features still work
✅ **Simple Implementation**: Just a filter parameter

The key is the `actionRequiredOnly` parameter that leverages the existing `IsResponsibleUser` logic to filter out monitoring-only items from action inboxes.
