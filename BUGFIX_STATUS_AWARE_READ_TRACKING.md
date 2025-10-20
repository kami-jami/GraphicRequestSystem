# Bug Fix: Status-Aware Read/Unread Tracking

## Problem
The initial per-request read/unread tracking implementation (Phase 18) tracked whether a user had viewed a request globally, but didn't account for status changes. When a request's status changed (e.g., from "In Design" to "Pending Approval"), it remained marked as "read" for the next responsible user, even though they hadn't seen it at the new status.

**Example Scenario:**
1. Designer views request when status = "Pending Designer Review" (Status 1)
2. Request is marked as read for Designer ✓
3. Designer completes work, status changes to "Pending Approval" (Status 4)
4. Approver sees request still marked as read ✗ (incorrect - they haven't seen it yet)

## Solution
Upgraded the read/unread tracking to be **status-aware**. Now the system tracks whether a user has viewed a request at its **current status**, not just whether they've ever viewed it.

### Implementation Changes

#### 1. Updated `RequestView` Entity
**File:** `GraphicRequestSystem.API/Core/Entities/RequestView.cs`

Added `ViewedAtStatus` field to track the status when the request was viewed:

```csharp
public class RequestView
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public int RequestId { get; set; }
    public RequestStatus ViewedAtStatus { get; set; }  // ✅ NEW
    public DateTime ViewedAt { get; set; }
    
    public AppUser User { get; set; }
    public Request Request { get; set; }
}
```

#### 2. Updated Database Indexes
**File:** `GraphicRequestSystem.API/Infrastructure/Data/AppDbContext.cs`

Changed unique constraint to include status, allowing multiple view records per request at different statuses:

```csharp
// Unique constraint: User can view same request multiple times at different statuses
modelBuilder.Entity<RequestView>()
    .HasIndex(rv => new { rv.UserId, rv.RequestId, rv.ViewedAtStatus })
    .IsUnique();

// Additional index for faster lookups
modelBuilder.Entity<RequestView>()
    .HasIndex(rv => new { rv.UserId, rv.RequestId });
```

#### 3. Updated `GetRequests` Endpoint
**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

Changed from loading just RequestIds to loading (RequestId, Status) pairs:

**Before:**
```csharp
var viewedRequestIds = await _context.RequestViews
    .Where(rv => rv.UserId == userId)
    .Select(rv => rv.RequestId)
    .ToListAsync();

IsUnread = !viewedRequestIds.Contains(r.Id)
```

**After:**
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

#### 4. Updated `GetInboxCounts` Endpoint
**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

Updated the helper function to use status-aware checking:

**Before:**
```csharp
var viewedRequestIds = await _context.RequestViews
    .Where(rv => rv.UserId == userId)
    .Select(rv => rv.RequestId)
    .ToListAsync();

var unreadCount = requestIds.Count(id => !viewedRequestIds.Contains(id));
```

**After:**
```csharp
var viewedRequestsWithStatus = await _context.RequestViews
    .Where(rv => rv.UserId == userId)
    .Select(rv => new { rv.RequestId, rv.ViewedAtStatus })
    .ToListAsync();

var viewedRequestStatusPairs = viewedRequestsWithStatus
    .Select(v => (v.RequestId, v.ViewedAtStatus))
    .ToHashSet();

var requestsWithStatus = await query.Select(r => new { r.Id, r.Status }).ToListAsync();
var unreadCount = requestsWithStatus.Count(r => !viewedRequestStatusPairs.Contains((r.Id, r.Status)));
```

#### 5. Updated `MarkRequestAsViewed` Endpoint
**File:** `GraphicRequestSystem.API/Controllers/RequestsController.cs`

Now saves the request's current status when marking as viewed:

**Before:**
```csharp
var existingView = await _context.RequestViews
    .FirstOrDefaultAsync(rv => rv.UserId == userId && rv.RequestId == id);

_context.RequestViews.Add(new RequestView
{
    UserId = userId,
    RequestId = id,
    ViewedAt = DateTime.UtcNow
});
```

**After:**
```csharp
var request = await _context.Requests
    .Where(r => r.Id == id)
    .Select(r => new { r.Id, r.Status })
    .FirstOrDefaultAsync();

var existingView = await _context.RequestViews
    .FirstOrDefaultAsync(rv => rv.UserId == userId 
        && rv.RequestId == id 
        && rv.ViewedAtStatus == request.Status);  // ✅ Check current status

_context.RequestViews.Add(new RequestView
{
    UserId = userId,
    RequestId = id,
    ViewedAtStatus = request.Status,  // ✅ Save current status
    ViewedAt = DateTime.UtcNow
});
```

#### 6. Database Migration
**File:** `GraphicRequestSystem.API/Migrations/20251020065936_AddViewedAtStatusToRequestView.cs`

Created and applied migration:
- Added `ViewedAtStatus` column (int, NOT NULL, default 0)
- Updated unique index to `(UserId, RequestId, ViewedAtStatus)`
- Added non-unique index on `(UserId, RequestId)` for faster lookups

```bash
dotnet ef migrations add AddViewedAtStatusToRequestView
dotnet ef database update
```

### Frontend
**No changes required!** The frontend already calls the backend API correctly:

```typescript
await markRequestAsViewed(requestId).unwrap();
```

The backend now handles status tracking automatically.

## Testing Scenarios

### Test Case 1: Designer → Approver Workflow
1. Designer opens request at Status 1 (Pending Designer Review)
   - Request marked as read for Designer ✓
2. Designer completes work, status changes to Status 4 (Pending Approval)
   - Request becomes unread for Approver ✓
3. Approver opens request at Status 4
   - Request marked as read for Approver ✓
4. Both users can now see their respective inboxes with correct unread counts ✓

### Test Case 2: Revision Workflow
1. Designer opens request at Status 3 (Design In Progress)
   - Request marked as read ✓
2. Approver requests redesign, status changes to Status 5 (Pending Redesign)
   - Request becomes unread for Designer again ✓
3. Designer opens request at Status 5
   - New view record created at Status 5 ✓

### Test Case 3: Multiple Views at Same Status
1. User opens request at Status 1
   - Creates RequestView record (UserId, RequestId, Status=1)
2. User opens same request again while still at Status 1
   - Updates ViewedAt timestamp on existing record (no duplicate)
3. Status changes to Status 2
4. User opens request again
   - Creates new RequestView record (UserId, RequestId, Status=2)

## Database Schema

**RequestViews Table:**
```
Id              int          PRIMARY KEY IDENTITY
UserId          nvarchar     FOREIGN KEY → AspNetUsers.Id
RequestId       int          FOREIGN KEY → Requests.Id
ViewedAtStatus  int          (RequestStatus enum value)
ViewedAt        datetime2    (Timestamp)

UNIQUE INDEX: (UserId, RequestId, ViewedAtStatus)
INDEX:        (UserId, RequestId)
```

**Sample Data:**
```
Id | UserId  | RequestId | ViewedAtStatus | ViewedAt
---|---------|-----------|----------------|--------------------
1  | user123 | 5         | 1              | 2024-01-15 10:00:00
2  | user456 | 5         | 4              | 2024-01-15 14:30:00
3  | user123 | 5         | 5              | 2024-01-16 09:15:00
```

This shows user123 viewed request #5 at three different statuses (1, 4, 5), and user456 viewed it at status 4.

## Benefits

✅ **Workflow-Aware Tracking**: Each user sees unread indicators relevant to their role and the current stage
✅ **Prevents Missed Notifications**: Status changes reset unread status for next responsible user
✅ **No Breaking Changes**: Frontend code unchanged, backward compatible
✅ **Efficient Lookups**: HashSet<(int, RequestStatus)> provides O(1) lookup performance
✅ **Flexible Design**: Supports complex multi-stage workflows with multiple reviews

## Status Enum Reference

```csharp
public enum RequestStatus
{
    Submitted = 0,           // Initial submission
    DesignerReview = 1,      // Waiting for designer assignment
    PendingCorrection = 2,   // Needs revision from submitter
    DesignInProgress = 3,    // Designer working
    PendingApproval = 4,     // Waiting for approver
    PendingRedesign = 5,     // Needs redesign from designer
    Completed = 6            // Final state
}
```

## Notes

- The `defaultValue: 0` in the migration ensures existing RequestView records get `ViewedAtStatus = 0` (Submitted)
- Frontend maintains backward compatibility - no changes needed
- Performance optimized with composite indexes and HashSet lookups
- Each status change creates opportunity for new "unread" state per user
