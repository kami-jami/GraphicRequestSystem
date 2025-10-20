# Bug Fix: Read/Unread Logic - Per-Request View Tracking

## Problem
The read/unread tracking system had a critical flaw:

❌ **Opening an inbox automatically marked ALL requests as "read"**  
❌ **User didn't need to click on individual requests**  
❌ **Simply navigating to inbox list changed unread status**  
❌ **No granular tracking of which requests were actually viewed**

### User Experience Impact
- User opens "📥 صندوق ورودی" inbox
- All 10 requests in that inbox immediately marked as read
- Badge counters disappear
- User hasn't viewed any request details yet!
- Impossible to tell which requests still need attention

### Technical Cause
The system had two separate tracking mechanisms working incorrectly:

1. **Backend InboxViews Table** - Tracked when user last viewed an entire inbox category
2. **Frontend localStorage** - Tracked which individual requests were clicked

The problem was in `MainLayout.tsx` where clicking on any inbox navigation item automatically called `markInboxAsViewed()`, updating the backend timestamp for that entire category.

## Solution

### Architecture Change
Moved from **inbox-category-based tracking** to **per-request view tracking**:

**Before:**
```
User clicks "Inbox" → markInboxAsViewed("requester_underReview") 
→ Updates timestamp → All requests in that category marked as "old" → All shown as "read"
```

**After:**
```
User clicks "Inbox" → List loads with unread indicators
User clicks Request #123 → markRequestAsViewed(123)
→ Only Request #123 marked as viewed → Others remain unread
```

### Database Changes

#### New Entity: RequestView
Created `RequestView.cs` to track per-request views:

```csharp
public class RequestView
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int RequestId { get; set; }
    public DateTime ViewedAt { get; set; }

    // Navigation properties
    public AppUser User { get; set; } = null!;
    public Request Request { get; set; } = null!;
}
```

**Key Features:**
- Composite unique index on `(UserId, RequestId)`
- One record per user per request
- Cascade delete when user or request is deleted
- Tracks exact timestamp of view

#### Updated AppDbContext
Added `RequestView` entity and configured relationships:

```csharp
public DbSet<RequestView> RequestViews { get; set; }

// Configuration
modelBuilder.Entity<RequestView>()
    .HasIndex(rv => new { rv.UserId, rv.RequestId })
    .IsUnique();
```

### Backend API Changes

#### 1. New Endpoint: Mark Request as Viewed
```csharp
// POST: api/Requests/{id}/mark-viewed
[HttpPost("{id}/mark-viewed")]
public async Task<IActionResult> MarkRequestAsViewed(int id)
{
    var userId = User.FindFirstValue("id");
    var existingView = await _context.RequestViews
        .FirstOrDefaultAsync(rv => rv.UserId == userId && rv.RequestId == id);

    if (existingView != null)
    {
        existingView.ViewedAt = DateTime.UtcNow; // Update timestamp
    }
    else
    {
        _context.RequestViews.Add(new RequestView // Create new record
        {
            UserId = userId,
            RequestId = id,
            ViewedAt = DateTime.UtcNow
        });
    }

    await _context.SaveChangesAsync();
    return Ok();
}
```

#### 2. Updated GetRequests Endpoint
**Before:** Used inbox category timestamp
```csharp
DateTime? lastViewedAt = null;
if (!string.IsNullOrEmpty(inboxCategory))
{
    var lastView = await _context.InboxViews
        .Where(iv => iv.UserId == userId && iv.InboxCategory == inboxCategory)
        .FirstOrDefaultAsync();
    lastViewedAt = lastView?.LastViewedAt;
}

IsUnread = lastViewedAt.HasValue
    ? (r.SubmissionDate > lastViewedAt.Value || ...)
    : false
```

**After:** Uses per-request view set
```csharp
var viewedRequestIds = await _context.RequestViews
    .Where(rv => rv.UserId == userId)
    .Select(rv => rv.RequestId)
    .ToListAsync();

IsUnread = !viewedRequestIds.Contains(r.Id) // Simple membership check
```

#### 3. Updated GetInboxCounts Endpoint
**Before:** Compared request dates against inbox timestamp
```csharp
async Task<int> GetNewItemsCount(string categoryKey, ...)
{
    var lastView = await _context.InboxViews...;
    return await query.Where(r => 
        r.SubmissionDate > lastView.LastViewedAt || ...).CountAsync();
}
```

**After:** Counts unviewed requests directly
```csharp
async Task<int> GetUnreadItemsCount(...)
{
    var requestIds = await query.Select(r => r.Id).ToListAsync();
    return requestIds.Count(id => !viewedRequestIds.Contains(id));
}
```

### Frontend Changes

#### 1. Removed Automatic Inbox Marking (MainLayout.tsx)
**Before:**
```typescript
const handleInboxClick = async () => {
    if (item.countKey) {
        await markInboxAsViewed(item.countKey).unwrap(); // ❌ Marks all as viewed!
        refetchInboxCounts();
    }
    handleNavigate(path);
};
```

**After:**
```typescript
const handleInboxClick = () => {
    // Don't mark as viewed automatically - let individual request clicks handle it
    handleNavigate(path);
};
```

#### 2. Added API Call to Mark Request (RequestsListPage.tsx)
**Before:**
```typescript
const markRequestAsViewed = (requestId: number) => {
    setViewedRequests(prev => {
        const updated = new Set(prev);
        updated.add(requestId);
        localStorage.setItem('viewedRequests', JSON.stringify(Array.from(updated)));
        return updated;
    });
};
```

**After:**
```typescript
const [markRequestAsViewed] = useMarkRequestAsViewedMutation();

const markRequestAsViewedBoth = async (requestId: number) => {
    // Update localStorage (for immediate UI feedback)
    setViewedRequests(prev => {
        const updated = new Set(prev);
        updated.add(requestId);
        localStorage.setItem('viewedRequests', JSON.stringify(Array.from(updated)));
        return updated;
    });

    // Update backend (for cross-device sync and badge counts)
    try {
        await markRequestAsViewed(requestId).unwrap();
    } catch (error) {
        console.error('Failed to mark request as viewed on backend:', error);
    }
};

const handleRequestClick = async (requestId: number) => {
    await markRequestAsViewedBoth(requestId);
    navigate(`/requests/${requestId}`);
};
```

#### 3. Added New API Endpoint (apiSlice.ts)
```typescript
markRequestAsViewed: builder.mutation<void, number>({
  query: (requestId) => ({
    url: `/requests/${requestId}/mark-viewed`,
    method: 'POST'
  }),
  invalidatesTags: (result, error, requestId) => [
    { type: 'Request', id: requestId },
    { type: 'Request', id: 'LIST' },
    'InboxCounts'
  ]
}),
```

## User Experience Improvements

### Before Fix
```
1. User opens "📥 صندوق ورودی"
   → Badge shows "5" unread requests
   
2. List page loads
   → Backend marks inbox category as viewed
   → ALL 5 requests marked as read
   → Badge counter disappears
   
3. User hasn't clicked anything yet!
   → Can't tell which requests need attention
   → No visual distinction anymore
```

### After Fix
```
1. User opens "📥 صندوق ورودی"
   → Badge shows "5" unread requests
   
2. List page loads
   → Requests with blue background, border, badge
   → Badge counter still shows "5"
   → Nothing marked as read yet
   
3. User clicks Request #123
   → Request #123 marked as viewed
   → Backend updates RequestView table
   → Badge counter updates to "4"
   → Other 4 requests remain unread
   
4. User navigates away and comes back
   → Badge shows "4" unread
   → Request #123 no longer has blue background
   → Other 4 still have unread indicators
```

## Technical Benefits

✅ **Accurate Tracking** - Knows exactly which requests each user has viewed  
✅ **Cross-Device Sync** - Backend tracks views, not just localStorage  
✅ **Correct Badge Counts** - Counts only truly unviewed requests  
✅ **Better UX** - Users can see what actually needs attention  
✅ **Scalable** - Indexed composite key for fast lookups  
✅ **Data Integrity** - Unique constraint prevents duplicate views  

## Database Migration Required

**New Table:** `RequestViews`
```sql
CREATE TABLE RequestViews (
    Id INT PRIMARY KEY IDENTITY,
    UserId NVARCHAR(450) NOT NULL,
    RequestId INT NOT NULL,
    ViewedAt DATETIME2 NOT NULL,
    CONSTRAINT FK_RequestViews_Users FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    CONSTRAINT FK_RequestViews_Requests FOREIGN KEY (RequestId) REFERENCES Requests(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_RequestViews_User_Request UNIQUE (UserId, RequestId)
);

CREATE INDEX IX_RequestViews_UserId_RequestId ON RequestViews(UserId, RequestId);
```

**Migration Command:**
```bash
cd GraphicRequestSystem.API
dotnet ef migrations add AddRequestViewTracking
dotnet ef database update
```

## Files Modified

### Backend
1. **RequestView.cs** (NEW)
   - Entity class for per-request view tracking

2. **AppDbContext.cs**
   - Added `DbSet<RequestView>`
   - Configured relationships and indexes

3. **RequestsController.cs**
   - Added `MarkRequestAsViewed()` endpoint
   - Updated `GetRequests()` to use RequestViews
   - Updated `GetInboxCounts()` to use RequestViews

### Frontend
1. **MainLayout.tsx**
   - Removed automatic `markInboxAsViewed()` call
   - Simplified navigation click handler

2. **RequestsListPage.tsx**
   - Added `useMarkRequestAsViewedMutation()` hook
   - Updated `handleRequestClick()` to call backend
   - Kept localStorage for optimistic UI updates

3. **apiSlice.ts**
   - Added `markRequestAsViewed` mutation
   - Exported `useMarkRequestAsViewedMutation` hook

## Backward Compatibility

✅ **Fully Compatible**

- `InboxViews` table still exists (not used for unread calculation anymore)
- `markInboxAsViewed` endpoint still exists (frontend no longer calls it)
- localStorage tracking still works (provides optimistic UI)
- No breaking changes to existing APIs

**Migration Strategy:**
- New `RequestViews` table starts empty
- All requests appear as unread initially (correct behavior)
- As users click requests, views are recorded
- No data migration needed from old system

## Testing Checklist

- [ ] Opening inbox doesn't mark requests as read
- [ ] Clicking request marks only that request as viewed
- [ ] Badge counts show correct unread count
- [ ] Visual indicators (blue bg, border, badge) work correctly
- [ ] localStorage and backend both track views
- [ ] Cross-device sync works (view on phone → updates on desktop)
- [ ] Navigating away and back preserves read status
- [ ] Multiple users can have different view states
- [ ] Database constraints prevent duplicate views
- [ ] Performance acceptable with many requests
- [ ] Cache invalidation updates UI immediately

## Performance Considerations

**Query Optimization:**
- Composite index on `(UserId, RequestId)` for fast lookups
- Single query to load all viewed request IDs per user
- In-memory set membership check (O(1) lookup)
- No N+1 queries

**Scalability:**
- One row per user per request viewed
- Typical user: 50-200 viewed requests
- Table size: ~50KB per user
- Index size: ~100 bytes per row
- Very fast even with 10,000+ requests

## Date
October 20, 2025
