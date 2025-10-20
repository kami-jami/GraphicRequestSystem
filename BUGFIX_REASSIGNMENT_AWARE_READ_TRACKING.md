# Bug Fix: Reassignment-Aware Read/Unread Tracking

## Problem
The previous status-aware implementation (Phase 19) tracked whether a user had viewed a request at its current status, but didn't account for **reassignments** within the same status. 

**Example Scenario:**
1. Request assigned to Designer A at Status 3 (Design In Progress) at 10:00 AM
2. Designer A views it at 10:05 AM → marked as read ✓
3. Admin reassigns to Designer B at 10:30 AM (status stays at 3)
4. Designer B sees request as "read" ✗ (incorrect - they haven't seen it yet)

The issue: Using `(UserId, RequestId, ViewedAtStatus)` as the unique check didn't account for the **timestamp** of when the last action occurred on the request.

## Solution
Enhanced the read/unread tracking to be **timestamp-aware**. Now the system compares:
- **User's last view timestamp** at current status
- **Request's last change timestamp** (from RequestHistories table)

If the last change happened AFTER the user's last view, the request becomes unread again.

### Key Insight
**A request is "unread" for a user if:**
1. They have **never** viewed it at the current status, OR
2. The last status change/reassignment happened **AFTER** their last view

This handles:
- ✅ Status changes (Designer completes → Approver sees as unread)
- ✅ Reassignments at same status (Admin reassigns Designer A → Designer B → B sees as unread)
- ✅ Multiple reassignments (Request bounces between users → each sees as unread on new assignment)
- ✅ Same user reassigned (Designer A → Designer B → Designer A again → A sees as unread)

## Implementation Changes

### 1. Updated `GetRequests` Endpoint
**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

**Before (Status-Only Check):**
```csharp
var viewedRequestsWithStatus = await _context.RequestViews
    .Where(rv => rv.UserId == userId)
    .Select(rv => new { rv.RequestId, rv.ViewedAtStatus })
    .ToListAsync();

var viewedRequestStatusPairs = viewedRequestsWithStatus
    .Select(v => (v.RequestId, v.ViewedAtStatus))
    .ToHashSet();

IsUnread = !viewedRequestStatusPairs.Contains((r.Id, r.Status))
```

**After (Timestamp-Aware Check):**
```csharp
// Load viewed requests WITH TIMESTAMPS
var viewedRequestsWithStatus = await _context.RequestViews
    .Where(rv => rv.UserId == userId)
    .Select(rv => new { rv.RequestId, rv.ViewedAtStatus, rv.ViewedAt })
    .ToListAsync();

// Create dictionary: (RequestId, Status) -> LastViewedTimestamp
var viewedRequestStatusMap = viewedRequestsWithStatus
    .GroupBy(v => (v.RequestId, v.ViewedAtStatus))
    .ToDictionary(
        g => g.Key,
        g => g.Max(v => v.ViewedAt) // Take latest view if multiple views at same status
    );

// Request is unread if never viewed OR last change happened after last view
IsUnread = !viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt) ||
          (r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt
```

**Logic Breakdown:**
- `!viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt)` 
  → Never viewed at current status
- `(r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt`
  → Last action happened AFTER user's last view

### 2. Updated `GetInboxCounts` Endpoint
**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

Applied the same timestamp-based logic to the helper function:

**Before:**
```csharp
var viewedRequestStatusPairs = viewedRequestsWithStatus
    .Select(v => (v.RequestId, v.ViewedAtStatus))
    .ToHashSet();

var unreadCount = requestsWithStatus.Count(r => 
    !viewedRequestStatusPairs.Contains((r.Id, r.Status))
);
```

**After:**
```csharp
var viewedRequestStatusMap = viewedRequestsWithStatus
    .GroupBy(v => (v.RequestId, v.ViewedAtStatus))
    .ToDictionary(
        g => g.Key,
        g => g.Max(v => v.ViewedAt)
    );

var requestsWithStatus = await query.Select(r => new 
{ 
    r.Id, 
    r.Status,
    r.SubmissionDate,
    LatestHistoryDate = _context.RequestHistories
        .Where(h => h.RequestId == r.Id)
        .Max(h => (DateTime?)h.ActionDate)
}).ToListAsync();

var unreadCount = requestsWithStatus.Count(r => 
    !viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt) ||
    (r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt
);
```

### 3. No Changes Needed
- ✅ **RequestView Entity**: Already has `ViewedAt` timestamp field
- ✅ **MarkRequestAsViewed Endpoint**: Already saves timestamp correctly
- ✅ **Database Schema**: No migration needed, existing fields are sufficient
- ✅ **Frontend**: No changes required

## How RequestHistories Support This

Every action that changes a request creates a `RequestHistory` entry with `ActionDate`:

**1. Status Changes:**
```csharp
// Designer completes work
await _context.RequestHistories.AddAsync(new RequestHistory
{
    RequestId = id,
    ActionDate = DateTime.UtcNow,
    PreviousStatus = RequestStatus.DesignInProgress,
    NewStatus = RequestStatus.PendingApproval,
    ...
});
```

**2. Designer Assignments:**
```csharp
// Admin assigns designer
await _context.RequestHistories.AddAsync(new RequestHistory
{
    RequestId = id,
    ActionDate = DateTime.UtcNow,
    PreviousStatus = RequestStatus.Submitted,
    NewStatus = RequestStatus.DesignInProgress,
    Comment = "یادداشت سیستمی: تخصیص به طراح"
});
```

**3. Approver Assignments:**
```csharp
// Admin assigns approver
await _context.RequestHistories.AddAsync(new RequestHistory
{
    RequestId = id,
    ActionDate = DateTime.UtcNow,
    ...
});
```

Every time a request is reassigned or its status changes, a new history entry is created with a fresh `ActionDate`. Our logic compares this against the user's `ViewedAt` timestamp.

## Testing Scenarios

### Test Case 1: Status Change (Designer → Approver)
```
10:00 AM - Designer views request at Status 3
          ViewedAt = 10:00 AM
          
10:30 AM - Designer completes work, status changes to 4
          New RequestHistory with ActionDate = 10:30 AM
          
Result: Approver sees request as UNREAD because:
        - Never viewed at Status 4 (TryGetValue returns false)
        
11:00 AM - Approver views request
          ViewedAt = 11:00 AM at Status 4
          
Result: Approver sees as READ (viewed at current status, no changes since)
```

### Test Case 2: Reassignment at Same Status
```
10:00 AM - Request assigned to Designer A at Status 3
          New RequestHistory with ActionDate = 10:00 AM
          
10:05 AM - Designer A views request
          ViewedAt = 10:05 AM at Status 3
          
10:30 AM - Admin reassigns to Designer B (status stays 3)
          New RequestHistory with ActionDate = 10:30 AM
          
Result: Designer B sees as UNREAD because:
        - Never viewed at Status 3 (TryGetValue returns false for Designer B)
        
Result: Designer A sees as UNREAD too because:
        - Viewed at Status 3 (TryGetValue = 10:05 AM)
        - BUT: LastHistoryDate (10:30 AM) > ViewedAt (10:05 AM) ✓
```

### Test Case 3: Multiple Reassignments
```
10:00 AM - Request assigned to Designer A
          LatestHistoryDate = 10:00 AM
          
10:05 AM - Designer A views it
          ViewedAt = 10:05 AM
          
10:30 AM - Reassigned to Designer B
          LatestHistoryDate = 10:30 AM
          
10:35 AM - Designer B views it
          ViewedAt = 10:35 AM
          
10:45 AM - Reassigned back to Designer A
          LatestHistoryDate = 10:45 AM
          
Result: Designer A sees as UNREAD because:
        - Viewed at Status 3 before (10:05 AM)
        - BUT: LatestHistoryDate (10:45 AM) > ViewedAt (10:05 AM) ✓
```

### Test Case 4: Same User Views Multiple Times (No Change)
```
10:00 AM - Designer A views request
          ViewedAt = 10:00 AM at Status 3
          
10:15 AM - Designer A views request again (no reassignment)
          ViewedAt updated to 10:15 AM
          LatestHistoryDate = 10:00 AM (no new history)
          
Result: Shows as READ because:
        - ViewedAt (10:15 AM) > LatestHistoryDate (10:00 AM) ✓
```

## Data Flow Example

**RequestViews Table:**
```
Id | UserId      | RequestId | ViewedAtStatus | ViewedAt
---|-------------|-----------|----------------|--------------------
1  | designer-a  | 5         | 3              | 2024-01-15 10:05:00
2  | designer-b  | 5         | 3              | 2024-01-15 10:35:00
3  | designer-a  | 5         | 3              | 2024-01-15 10:50:00  (updated after reassignment)
```

**RequestHistories Table:**
```
Id | RequestId | ActionDate          | Comment
---|-----------|---------------------|------------------------
1  | 5         | 2024-01-15 10:00:00 | Assigned to Designer A
2  | 5         | 2024-01-15 10:30:00 | Reassigned to Designer B
3  | 5         | 2024-01-15 10:45:00 | Reassigned to Designer A
```

**At 10:46 AM, before Designer A opens the request:**
- Designer A's last view: 10:05:00 (row 1)
- Request's last history: 10:45:00 (row 3)
- 10:45:00 > 10:05:00 → **UNREAD** ✓

**At 10:50 AM, after Designer A opens the request:**
- Designer A's view updated: 10:50:00 (row 3)
- Request's last history: 10:45:00 (no change)
- 10:50:00 > 10:45:00 → **READ** ✓

## Performance Considerations

### Dictionary Lookup (Efficient)
```csharp
var viewedRequestStatusMap = viewedRequestsWithStatus
    .GroupBy(v => (v.RequestId, v.ViewedAtStatus))
    .ToDictionary(g => g.Key, g => g.Max(v => v.ViewedAt));
```

- **Time Complexity**: O(n) to build, O(1) per lookup
- **Space Complexity**: O(n) where n = number of unique (RequestId, Status) pairs user has viewed

### Single Query Pattern
Both `GetRequests` and `GetInboxCounts` use single queries:
```csharp
// One query for all view data
var viewedRequestsWithStatus = await _context.RequestViews
    .Where(rv => rv.UserId == userId)
    .Select(rv => new { rv.RequestId, rv.ViewedAtStatus, rv.ViewedAt })
    .ToListAsync();

// One query for all request data
var requests = await query
    .Select(r => new { r.Id, r.Status, r.SubmissionDate, LatestHistoryDate = ... })
    .ToListAsync();

// In-memory comparison (fast)
IsUnread = !viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt) ||
          (r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt;
```

## Benefits

✅ **Handles Reassignments**: Request becomes unread when reassigned, even at same status  
✅ **Timestamp-Based Logic**: Compares action time vs. view time for accuracy  
✅ **No Schema Changes**: Uses existing ViewedAt and ActionDate fields  
✅ **Backward Compatible**: Existing view records still work correctly  
✅ **Efficient Queries**: Single database query + O(1) dictionary lookup  
✅ **Workflow-Aware**: Covers all scenarios: status changes, reassignments, multiple bounces  

## Status Flow Reference

```
0 (Submitted)
    ↓ [Admin assigns designer] → Creates RequestHistory
1 (DesignerReview)
    ↓ [Designer accepts] → Creates RequestHistory
3 (DesignInProgress)
    ↓ [Designer completes] → Creates RequestHistory
4 (PendingApproval)
    ↓ [Approver requests redesign] → Creates RequestHistory
5 (PendingRedesign)
    ↓ [Designer resubmits] → Creates RequestHistory
4 (PendingApproval)
    ↓ [Approver approves] → Creates RequestHistory
6 (Completed)
```

**Every arrow creates a RequestHistory entry**, which updates the `LatestHistoryDate` used in our unread comparison.

## Related Changes

- **Phase 18**: Initial per-request view tracking (replaced inbox-category tracking)
- **Phase 19**: Added status-aware tracking (reset unread on status change)
- **Phase 20 (This)**: Added timestamp-based tracking (reset unread on reassignment)

## Notes

- No frontend changes required
- No database migration needed
- Pre-existing nullable warnings are unrelated to these changes
- Solution handles edge cases like same-user reassignments
- Works correctly with SignalR real-time updates (requests refresh when histories change)
