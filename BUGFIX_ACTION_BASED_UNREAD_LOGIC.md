# Bug Fix: Action-Based Unread Logic

## Problem Statement

**Issue:** The previous read/unread tracking system marked requests as "unread" for ALL users who could see them whenever a status changed, even if those users didn't need to take any action. This created cluttered inboxes and confusion.

**Example of the Problem:**
```
1. Designer completes a request → Status changes to "Pending Approval"
2. OLD BEHAVIOR:
   - Approver sees it as UNREAD ✓ (correct - needs to approve)
   - Designer sees it as UNREAD ✗ (wrong - already completed, just waiting)
   - Requester sees it as UNREAD ✗ (wrong - just needs to be informed)
   - Admin sees it as UNREAD ✗ (wrong - just monitoring)
```

This meant everyone's inbox was constantly filled with "unread" items they couldn't act on, defeating the purpose of the unread indicator.

## Solution

**Principle:** Only mark requests as "unread" for users who are **responsible for taking action** at the current status. Other stakeholders receive notifications but don't see unread indicators.

### Responsibility Matrix

| Status | Value | Responsible User | Action Required | Others Notified |
|--------|-------|-----------------|-----------------|-----------------|
| **Submitted** | 0 | Admin | Assign designer | Requester (info) |
| **DesignerReview** | 1 | Assigned Designer | Start design work | Admin, Requester |
| **PendingCorrection** | 2 | Requester | Fix issues & resubmit | Designer, Admin |
| **DesignInProgress** | 3 | Designer | Complete design | Requester, Admin |
| **PendingApproval** | 4 | Approver | Approve or reject | Designer, Requester, Admin |
| **PendingRedesign** | 5 | Designer | Redesign & resubmit | Approver, Requester, Admin |
| **Completed** | 6 | None | No action needed | All (info only) |

## Implementation

### 1. Added Helper Method: `IsResponsibleUser`

**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

This static method determines if a user is the one responsible for action at the current status:

```csharp
private static bool IsResponsibleUser(
    string currentUserId,
    string? requesterId,
    string? designerId,
    string? approverId,
    Core.Enums.RequestStatus status,
    IList<string> userRoles)
{
    return status switch
    {
        // Status 0 (Submitted): Admin needs to assign designer
        Core.Enums.RequestStatus.Submitted => userRoles.Contains("Admin"),
        
        // Status 1 (DesignerReview): Assigned designer needs to start work
        Core.Enums.RequestStatus.DesignerReview => currentUserId == designerId,
        
        // Status 2 (PendingCorrection): Requester needs to fix and resubmit
        Core.Enums.RequestStatus.PendingCorrection => currentUserId == requesterId,
        
        // Status 3 (DesignInProgress): Designer needs to complete
        Core.Enums.RequestStatus.DesignInProgress => currentUserId == designerId,
        
        // Status 4 (PendingApproval): Approver needs to approve/reject
        Core.Enums.RequestStatus.PendingApproval => currentUserId == approverId,
        
        // Status 5 (PendingRedesign): Designer needs to redesign and resubmit
        Core.Enums.RequestStatus.PendingRedesign => currentUserId == designerId,
        
        // Status 6 (Completed): No action needed from anyone
        Core.Enums.RequestStatus.Completed => false,
        
        _ => false
    };
}
```

### 2. Updated GetRequests Endpoint

**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

**Added assignment fields to query:**
```csharp
var requests = await query
    .Include(r => r.Requester)
    .Include(r => r.RequestType)
    .Select(r => new
    {
        r.Id,
        r.Title,
        r.Status,
        r.Priority,
        r.RequesterId,    // ✅ ADDED
        r.DesignerId,     // ✅ ADDED
        r.ApproverId,     // ✅ ADDED
        // ... other fields
    })
    .ToListAsync();
```

**Updated IsUnread calculation:**
```csharp
// Before:
IsUnread = !viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt) ||
          (r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt

// After:
IsUnread = IsResponsibleUser(userId, r.RequesterId, r.DesignerId, r.ApproverId, r.Status, userRoles) &&
          (!viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt) ||
          (r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt)
```

**Logic Breakdown:**
1. First check: `IsResponsibleUser(...)` - Is this user responsible for action?
2. Second check: `!viewedRequestStatusMap.TryGetValue(...)` - Never viewed at current status?
3. Third check: `(r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt` - Changed since last view?

**Only if user IS responsible AND (never viewed OR changed since view) → UNREAD**

### 3. Updated GetInboxCounts Endpoint

**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

Updated the helper function to include assignment checks:

```csharp
async Task<int> GetUnreadItemsCount(Func<IQueryable<Request>, IQueryable<Request>> filter)
{
    var query = _context.Requests.AsQueryable();
    query = filter(query);

    // Get all requests with assignments
    var requestsWithStatus = await query.Select(r => new
    {
        r.Id,
        r.Status,
        r.RequesterId,    // ✅ ADDED
        r.DesignerId,     // ✅ ADDED
        r.ApproverId,     // ✅ ADDED
        r.SubmissionDate,
        LatestHistoryDate = _context.RequestHistories
            .Where(h => h.RequestId == r.Id)
            .Max(h => (DateTime?)h.ActionDate)
    }).ToListAsync();

    // Count only unread items where user is responsible
    var unreadCount = requestsWithStatus.Count(r =>
        IsResponsibleUser(userId, r.RequesterId, r.DesignerId, r.ApproverId, r.Status, userRoles) &&
        (!viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt) ||
        (r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt)
    );

    return unreadCount;
}
```

## Workflow Examples

### Example 1: Designer Workflow

```
Time  | Event                          | Designer View      | Approver View      | Requester View
------|--------------------------------|-------------------|-------------------|------------------
10:00 | Admin assigns Designer A       | UNREAD (action)   | READ (just info)  | READ (just info)
10:05 | Designer A starts work         | READ (completed)  | READ (no change)  | READ (no change)
10:30 | Designer A sends for approval  | READ (no action)  | UNREAD (action)   | READ (just info)
11:00 | Approver approves              | READ (no action)  | READ (completed)  | READ (just info)
```

**Benefits:**
- Designer only sees UNREAD when assigned (needs to start)
- After starting, it's READ (no more action needed)
- Approver only sees UNREAD when needs approval
- Requester never sees UNREAD (just monitoring)

### Example 2: Revision Workflow

```
Time  | Event                          | Designer View      | Approver View      | Requester View
------|--------------------------------|-------------------|-------------------|------------------
10:00 | Designer sends for approval    | READ (no action)  | UNREAD (action)   | READ (just info)
10:30 | Approver requests redesign     | UNREAD (action)   | READ (completed)  | READ (just info)
10:45 | Designer starts redesign       | READ (working)    | READ (no change)  | READ (no change)
11:00 | Designer resubmits             | READ (no action)  | UNREAD (action)   | READ (just info)
11:30 | Approver approves              | READ (no action)  | READ (completed)  | READ (just info)
```

**Benefits:**
- Designer sees UNREAD only when needs to redesign
- Approver sees UNREAD only when needs to review
- No ping-pong of unread states for users just monitoring

### Example 3: Correction Workflow

```
Time  | Event                          | Designer View      | Requester View     | Admin View
------|--------------------------------|-------------------|-------------------|------------------
10:00 | Designer returns for correction| READ (no action)  | UNREAD (action)   | READ (just info)
10:30 | Requester fixes & resubmits    | READ (no change)  | READ (completed)  | UNREAD (action)
10:45 | Admin assigns to same designer | UNREAD (action)   | READ (just info)  | READ (completed)
```

**Benefits:**
- Requester sees UNREAD only when needs to fix
- Designer doesn't see UNREAD until reassigned
- Admin sees UNREAD only when needs to assign

## Comparison: Before vs After

### Scenario: Designer Completes Work

**Before (Phase 20 - Reassignment-Aware):**
```
Designer completes → Status: PendingApproval
- Approver: UNREAD ✓ (needs to approve)
- Designer: UNREAD ✗ (no action, just waiting)
- Requester: UNREAD ✗ (no action, just monitoring)
- Admin: UNREAD ✗ (no action, just monitoring)
```

**After (Phase 21 - Action-Based):**
```
Designer completes → Status: PendingApproval
- Approver: UNREAD ✓ (needs to approve)
- Designer: READ ✓ (no action needed)
- Requester: READ ✓ (no action needed)
- Admin: READ ✓ (no action needed)
```

### Scenario: Requester Submits Request

**Before:**
```
Requester submits → Status: Submitted
- Admin: UNREAD ✓ (needs to assign)
- Requester: UNREAD ✗ (no action, just waiting)
```

**After:**
```
Requester submits → Status: Submitted
- Admin: UNREAD ✓ (needs to assign)
- Requester: READ ✓ (no action needed)
```

## Benefits

✅ **Cleaner Inboxes**: Users only see unread for items requiring action  
✅ **Reduced Confusion**: Clear distinction between "needs my action" vs "just informational"  
✅ **Better Prioritization**: Unread badge means "you need to do something"  
✅ **Notification Separation**: Notifications inform, unread indicates action  
✅ **Role-Aware**: Respects workflow responsibility at each stage  
✅ **No False Alarms**: Senders don't see their own submissions as unread again  

## Technical Details

### Status-to-Responsibility Mapping

```csharp
Status 0 (Submitted)         → Admin (has "Admin" role)
Status 1 (DesignerReview)    → Designer (userId == designerId)
Status 2 (PendingCorrection) → Requester (userId == requesterId)
Status 3 (DesignInProgress)  → Designer (userId == designerId)
Status 4 (PendingApproval)   → Approver (userId == approverId)
Status 5 (PendingRedesign)   → Designer (userId == designerId)
Status 6 (Completed)         → None (false for everyone)
```

### Performance Considerations

**Query Impact:**
- Added 3 fields to projection: `RequesterId`, `DesignerId`, `ApproverId`
- Minimal overhead (simple property access)
- No additional joins required (already included in Request entity)

**Memory Impact:**
- Helper method is `static` (no instance allocation)
- Switch expression is compiled to efficient branching
- O(1) responsibility check per request

**Scalability:**
- Same number of database queries as before (2 queries total)
- In-memory filtering on already-fetched data
- No N+1 query problems

## Frontend Impact

**No frontend changes required!** The frontend already:
- Receives `IsUnread` boolean from backend
- Displays visual indicators based on this flag
- Calls `markRequestAsViewed` when user clicks

The backend's new logic is **transparent** to the frontend.

## Database Impact

**No schema changes required!** The implementation uses:
- Existing `RequestView` table (tracks views)
- Existing `Request` table (has RequesterId, DesignerId, ApproverId)
- Existing `RequestHistories` table (tracks status changes)

## Testing Scenarios

### Test 1: Admin Assignment Flow
```
1. Requester submits request
   → Admin: UNREAD (needs to assign)
   → Requester: READ (no action)
   
2. Admin assigns designer
   → Admin: READ (action completed)
   → Designer: UNREAD (needs to start)
   → Requester: READ (no action)
```

### Test 2: Designer Work Flow
```
1. Designer starts work
   → Designer: READ (action completed)
   → Admin: READ (no action)
   
2. Designer completes
   → Designer: READ (no action)
   → Approver: UNREAD (needs approval)
```

### Test 3: Approval Flow
```
1. Approver requests redesign
   → Approver: READ (action completed)
   → Designer: UNREAD (needs to redesign)
   → Requester: READ (no action)
   
2. Designer resubmits
   → Designer: READ (no action)
   → Approver: UNREAD (needs to re-approve)
```

### Test 4: Completed Status
```
1. Request marked complete
   → Designer: READ (no action)
   → Approver: READ (no action)
   → Requester: READ (no action)
   → Admin: READ (no action)
   → All users: No unread indicator ✓
```

## Migration Notes

**Existing Data:**
- No migration needed
- Existing RequestView records remain valid
- System automatically applies new logic on next fetch

**User Experience:**
- Users may notice fewer "unread" items after deployment
- This is expected behavior - only action items show as unread now
- Notifications still inform users of all changes

## Related Changes

- **Phase 18**: Initial per-request view tracking (replaced inbox-category tracking)
- **Phase 19**: Status-aware tracking (reset unread on status change)
- **Phase 20**: Reassignment-aware tracking (reset unread on reassignment)
- **Phase 21 (This)**: Action-based tracking (unread only for responsible user)

## Configuration

No configuration changes required. The responsibility logic is **hardcoded** based on:
- Request status (enum value)
- User ID assignments (RequesterId, DesignerId, ApproverId)
- User roles (Admin role check for Status 0)

## Future Enhancements

Potential improvements for future versions:

1. **Configurable Responsibility Rules**: Allow admins to customize who is responsible at each status
2. **Multiple Approvers**: Support for requests requiring multiple approvals
3. **Delegation**: Allow users to delegate their action items to others
4. **SLA Tracking**: Track how long requests stay unread for responsible users
5. **Escalation**: Auto-notify managers if action items remain unread too long

## Notes

- No frontend changes required
- No database migration needed
- Backward compatible with existing data
- Performance impact is negligible
- Logic is deterministic and testable
