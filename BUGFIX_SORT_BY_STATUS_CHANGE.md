# Sorting Fix: Sort Requests by Last Status Change Date

## Problem
Requests were being sorted by submission date (registration date) regardless of their activity. This meant that:
- A request submitted 2 weeks ago but updated yesterday appeared at the bottom
- Recently updated requests weren't visible at the top of the list
- Users couldn't easily see which requests had recent activity

**User Request:** "Requests for all users, all roles, all inboxes, and all filters should be listed based on the last date their status was changed"

## Solution
Changed the sorting logic to use **last status change date** instead of submission date. This ensures:
- ✅ Recently updated requests appear at the top
- ✅ Active requests with recent status changes are prioritized
- ✅ Users can quickly identify requests with recent activity
- ✅ Sorting is consistent across all roles, inboxes, and filters

## Technical Implementation

### Backend Changes (`RequestsController.cs`)

#### 1. Data Calculation (Lines 123-126)
The backend already calculated `LatestHistoryDate` from the `RequestHistories` table:

```csharp
LatestHistoryDate = _context.RequestHistories
    .Where(h => h.RequestId == r.Id)
    .Max(h => (DateTime?)h.ActionDate)
```

This finds the most recent status change for each request.

#### 2. Added to API Response (Lines 130-145)
**Before:** `LatestHistoryDate` was calculated but not returned to frontend
**After:** Added to response object:

```csharp
var requestsWithUnread = requests.Select(r => new
{
    r.Id,
    r.Title,
    r.Status,
    r.Priority,
    r.RequesterName,
    r.RequesterUsername,
    r.RequestTypeName,
    r.DueDate,
    r.SubmissionDate,
    r.LatestHistoryDate,  // ✅ Now included in response
    // Fallback to submission date if no history exists
    LastStatusChangeDate = r.LatestHistoryDate ?? r.SubmissionDate,
    IsUnread = ...
}).ToList();
```

#### 3. Updated Sorting Logic (Lines 147-150)
**Before:** Complex role-based sorting with unread priority
```csharp
// Different sorting for designers vs others
if (userRoles.Contains("Designer"))
{
    requestsWithUnread = requestsWithUnread
        .OrderByDescending(r => r.IsUnread)
        .ThenBy(r => r.IsUnread ? r.DueDate : (DateTime?)null)
        .ThenByDescending(r => r.SubmissionDate)
        .ToList();
}
else
{
    requestsWithUnread = requestsWithUnread
        .OrderByDescending(r => r.IsUnread)
        .ThenByDescending(r => r.SubmissionDate)
        .ToList();
}
```

**After:** Simple, consistent sorting for all roles
```csharp
// Sort by last status change date (newest activity first)
requestsWithUnread = requestsWithUnread
    .OrderByDescending(r => r.LastStatusChangeDate)
    .ToList();
```

### Frontend Changes (`RequestsListPage.tsx`)

#### Updated Sorting Logic (Lines 186-202)
**Before:** Unread items at top, then sorted by submission date
```typescript
const sortedRequests = requests ? [...requests].sort((a, b) => {
    // Check if request is truly unread
    const aIsUnread = a.isUnread && !viewedRequests.has(a.id);
    const bIsUnread = b.isUnread && !viewedRequests.has(b.id);

    // Always keep unread items at the top
    if (aIsUnread && !bIsUnread) return -1;
    if (!aIsUnread && bIsUnread) return 1;

    // Then sort by submission date
    return new Date(b.submissionDate || b.dueDate).getTime() - 
           new Date(a.submissionDate || a.dueDate).getTime();
}) : [];
```

**After:** Sort by last status change date
```typescript
const sortedRequests = requests ? [...requests].sort((a, b) => {
    switch (sortBy) {
        case 'priority':
            return (b.priority || 0) - (a.priority || 0);
        case 'status':
            return (a.status || 0) - (b.status || 0);
        case 'date':
        default: {
            // Sort by last status change date (newest first)
            const aDate = a.lastStatusChangeDate || a.submissionDate || a.dueDate;
            const bDate = b.lastStatusChangeDate || b.submissionDate || b.dueDate;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
    }
}) : [];
```

## How Last Status Change Date is Determined

### RequestHistory Table Tracking
Every status change is recorded in the `RequestHistories` table:

```csharp
public class RequestHistory
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public DateTime ActionDate { get; set; }        // ✅ Timestamp of change
    public RequestStatus PreviousStatus { get; set; }
    public RequestStatus NewStatus { get; set; }
    public string? ActorId { get; set; }
    public string? Comment { get; set; }
}
```

### Examples of Status Changes Tracked:
1. **Submission** (0 → Submitted)
2. **Designer Assignment** (0 → 1: DesignerReview)
3. **Start Design** (1 → 3: DesignInProgress)
4. **Submit for Approval** (3 → 4: PendingApproval)
5. **Return for Revision** (4 → 5: PendingRedesign or 1 → 2: PendingCorrection)
6. **Complete** (4 → 6: Completed)

### Fallback Logic
```
LastStatusChangeDate = LatestHistoryDate ?? SubmissionDate
```

- If request has status changes → Use most recent change date
- If request has no history → Use submission date
- This ensures ALL requests have a valid sort date

## User Experience Improvements

### Before Fix
```
Request List (sorted by submission date):
┌─────────────────────────────────────────────────┐
│ Request #100 - Submitted 1 week ago             │
│ Status: Completed (changed today)               │  ❌ At bottom despite being updated today
├─────────────────────────────────────────────────┤
│ Request #105 - Submitted 2 days ago             │
│ Status: DesignerReview (no changes)             │
├─────────────────────────────────────────────────┤
│ Request #110 - Submitted yesterday              │
│ Status: Submitted (no changes)                  │  ✅ At top because submitted recently
└─────────────────────────────────────────────────┘
```

### After Fix
```
Request List (sorted by last status change):
┌─────────────────────────────────────────────────┐
│ Request #100 - Submitted 1 week ago             │
│ Status: Completed (changed today)               │  ✅ At top because updated today
├─────────────────────────────────────────────────┤
│ Request #110 - Submitted yesterday              │
│ Status: Submitted (no changes)                  │  ✅ Recent submission
├─────────────────────────────────────────────────┤
│ Request #105 - Submitted 2 days ago             │
│ Status: DesignerReview (no changes)             │  ✅ Older, less active
└─────────────────────────────────────────────────┘
```

## Behavioral Changes

### What Changed

1. **Removed Unread Priority**
   - Before: Unread items always at top regardless of date
   - After: All items sorted by activity date (unread badge still visible)
   - Rationale: Recent activity more important than unread status

2. **Removed Designer-Specific Sorting**
   - Before: Designers had special sorting by due date for unread items
   - After: All users see same chronological sorting
   - Rationale: Consistency across all roles

3. **Consistent Across All Views**
   - Before: Different sorting for different roles/inboxes
   - After: Same sorting logic everywhere
   - Applies to: All users, all roles, all inboxes, all filters

### What Stayed the Same

1. **Unread Indicators** still work (blue background, border, badge, bold text)
2. **Manual sort options** still available (Priority, Status, Date)
3. **Filtering** by status, search, etc. still works
4. **View tracking** per-request still functional
5. **Pagination** logic unchanged

## Example Scenarios

### Scenario 1: Designer Workflow
```
Monday: Request #1 submitted
Tuesday: Request #2 submitted
Wednesday: Request #1 assigned to designer (status change)
Thursday: Request #2 assigned to designer (status change)
Friday: Request #1 design completed (status change)

Display Order (Friday):
1. Request #1 (status changed Friday - most recent)
2. Request #2 (status changed Thursday)
```

### Scenario 2: Requester Workflow
```
Week 1: Submit Request #100
Week 2: Submit Request #101
Week 3: Request #100 returned for correction (status change)
Week 4: Request #101 assigned to designer (status change)

Display Order (Week 4):
1. Request #101 (status changed Week 4 - most recent)
2. Request #100 (status changed Week 3)
```

### Scenario 3: Approver Workflow
```
Day 1: Request #50 submitted for approval
Day 2: Request #51 submitted for approval
Day 3: Request #50 approved (status change to Completed)
Day 4: Request #52 submitted for approval

Display Order (Day 4):
1. Request #52 (submitted Day 4 - most recent)
2. Request #50 (completed Day 3)
3. Request #51 (submitted Day 2, no changes)
```

## Benefits

✅ **Recent Activity Visible:** Requests with recent changes appear at top  
✅ **Better Workflow:** Users see what's actively happening  
✅ **Consistent UX:** Same sorting logic across all roles and views  
✅ **Simpler Code:** Removed complex role-based sorting logic  
✅ **Performance:** Single sort operation instead of multiple conditional sorts  
✅ **Accurate Tracking:** Uses actual status change data from database  

## Files Modified

1. **Backend:**
   - `GraphicRequestSystem.API/Controllers/RequestsController.cs` (Lines 130-150)
     - Added `LatestHistoryDate` to response
     - Added `LastStatusChangeDate` calculated field
     - Simplified sorting to use `LastStatusChangeDate`

2. **Frontend:**
   - `graphic-request-client/src/pages/RequestsListPage.tsx` (Lines 186-202)
     - Updated sorting to use `lastStatusChangeDate`
     - Removed unread priority sorting
     - Added fallback to submissionDate if needed

## Testing Checklist

- [x] Requests with recent status changes appear at top
- [x] Newly submitted requests appear at top
- [x] Completed requests with recent completion appear appropriately
- [x] Requests with no history fall back to submission date
- [x] Sorting works for all roles (Requester, Designer, Approver, Admin)
- [x] Sorting works in all inboxes (Inbox, Outbox, Completed, All)
- [x] Manual sort by Priority still works
- [x] Manual sort by Status still works
- [x] Search filtering doesn't break sorting
- [x] Status filtering doesn't break sorting
- [x] Pagination respects sort order
- [x] No compilation errors

## Database Dependencies

**Requires:** `RequestHistories` table with status change tracking

**Automatic:** Status changes are automatically recorded when:
- Request submitted
- Designer assigned
- Design started
- Design submitted for approval
- Request approved/rejected
- Request completed
- Request returned for correction

**No migration needed** - `RequestHistories` table already exists and is populated.

## Backward Compatibility

✅ **Fully Compatible**
- API response structure extended (added `lastStatusChangeDate`)
- Frontend gracefully handles missing field with fallback
- No breaking changes to existing functionality
- Unread tracking still works
- View tracking still works

## Performance Considerations

**Improved:**
- Single sort operation instead of conditional multi-level sorts
- Less client-side processing
- Simpler code = faster execution

**Database Query:**
- `LatestHistoryDate` uses indexed `RequestId` on `RequestHistories`
- Efficient MAX aggregate query
- No N+1 query issues

## Date
October 20, 2025
