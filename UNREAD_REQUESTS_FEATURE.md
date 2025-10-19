# Unread Requests Feature

## Overview
Implemented a feature to highlight unread/new requests in the requests list. Unread requests are displayed with a distinct visual style and automatically sorted to the top of the list.

## Implementation Date
October 19, 2025

## Changes Made

### 1. Backend Changes (RequestsController.cs)

#### Modified `GetRequests` Endpoint
**File**: `GraphicRequestSystem.API/Controllers/RequestsController.cs`

**Changes**:
- Added `inboxCategory` query parameter to identify which inbox the user is viewing
- Added logic to fetch the last viewed timestamp for that inbox category from `InboxViews` table
- Added `IsUnread` flag calculation that checks if:
  - Request was submitted after last view, OR
  - Request has history entries (status changes, comments) after last view
- Modified sorting to prioritize unread items:
  - For Designers: Unread first, then sorted by DueDate
  - For Others: Unread first, then sorted by DueDate descending
- Includes `LatestHistoryDate` in query to determine if request has recent activity

**Key Code**:
```csharp
// Get last viewed timestamp
DateTime? lastViewedAt = null;
if (!string.IsNullOrEmpty(inboxCategory))
{
    var lastView = await _context.InboxViews
        .Where(iv => iv.UserId == userId && iv.InboxCategory == inboxCategory)
        .FirstOrDefaultAsync();
    lastViewedAt = lastView?.LastViewedAt;
}

// Calculate IsUnread flag
IsUnread = lastViewedAt.HasValue 
    ? (r.SubmissionDate > lastViewedAt.Value || 
       (r.LatestHistoryDate.HasValue && r.LatestHistoryDate.Value > lastViewedAt.Value))
    : false

// Sort: unread first
requestsWithUnread = requestsWithUnread
    .OrderByDescending(r => r.IsUnread)
    .ThenBy(r => r.DueDate)
    .ToList();
```

### 2. Frontend API Changes (apiSlice.ts)

#### Updated GetRequestsParams Interface
**File**: `graphic-request-client/src/services/apiSlice.ts`

**Changes**:
- Added `inboxCategory?: string` parameter to interface
- Updated `getRequests` endpoint to pass `inboxCategory` as query parameter

**Code**:
```typescript
interface GetRequestsParams {
  statuses?: number[];
  searchTerm?: string;
  inboxCategory?: string;  // NEW
}
```

### 3. Frontend UI Changes (RequestsListPage.tsx)

#### Added Inbox Category Mapping
**File**: `graphic-request-client/src/pages/RequestsListPage.tsx`

**Changes**:
1. Created `getInboxCategory` function to map status combinations to inbox categories:
   ```typescript
   const getInboxCategory = (statuses: number[]): string | undefined => {
       const statusStr = statuses.sort().join(',');
       const categoryMap: Record<string, string> = {
           '0,1': 'requester_underReview',
           '2': 'requester_needsRevision',
           '1,5': 'designer_pendingAction',
           '3': 'designer_inProgress',
           '4': 'designer_pendingApproval',
           '3,5': 'designer_inProgress',
       };
       return categoryMap[statusStr];
   };
   ```

2. Pass inbox category to API query:
   ```typescript
   const inboxCategory = getInboxCategory(statusFilter);
   const { data: requests, isLoading } = useGetRequestsQuery({
       statuses: statusFilter,
       searchTerm: searchTerm,
       inboxCategory: inboxCategory,
   });
   ```

#### Enhanced Visual Styling for Unread Items

**RequestTableRow Component** (Desktop/Tablet view):
- Light blue background: `alpha(theme.palette.info.main, 0.08)`
- Blue right border: `3px solid ${theme.palette.info.main}`
- "جدید" (New) badge next to ID with info color
- Enhanced hover effects

**RequestListItem Component** (Mobile view):
- Light blue background: `alpha(theme.palette.info.main, 0.05)`
- Blue border: `1px solid info.main`
- Blue right border: `4px solid ${theme.palette.info.main}`
- "جدید" (New) badge in title row
- Enhanced hover effects with info color

#### Updated Sorting Logic
Modified sorting to always keep unread items at the top:
```typescript
const sortedRequests = requests ? [...requests].sort((a, b) => {
    // Always keep unread items at the top
    if (a.isUnread && !b.isUnread) return -1;
    if (!a.isUnread && b.isUnread) return 1;
    
    // Then apply secondary sorting
    switch (sortBy) {
        case 'priority': return (b.priority || 0) - (a.priority || 0);
        case 'status': return (a.status || 0) - (b.status || 0);
        case 'date':
        default: return new Date(b.submissionDate || b.dueDate).getTime() - 
                        new Date(a.submissionDate || a.dueDate).getTime();
    }
}) : [];
```

## Visual Design

### Unread Item Indicators
1. **Background Color**: Light blue tint (`rgba(info, 0.08)` for table, `rgba(info, 0.05)` for cards)
2. **Border Accent**: Blue right border (3-4px solid)
3. **"جدید" Badge**: 
   - Small chip with info color background
   - White text
   - Positioned next to request ID
4. **Enhanced Hover**: Stronger blue glow on hover for unread items

### Color Scheme
- **Primary Indicator Color**: `theme.palette.info.main` (blue)
- **Background**: `alpha(info, 0.05-0.08)` for subtle highlight
- **Border**: Solid info color for strong visual separation
- **Badge**: Solid info background with white text

## Inbox Categories Mapping

The system maps URL status combinations to inbox categories for tracking:

| Status Combination | Inbox Category | Description |
|-------------------|----------------|-------------|
| `0,1` | `requester_underReview` | Submitted requests awaiting designer action |
| `2` | `requester_needsRevision` | Requests returned for correction |
| `1,5` | `designer_pendingAction` | Requests assigned but not started |
| `3` | `designer_inProgress` | Requests currently being designed |
| `4` | `designer_pendingApproval` | Completed designs awaiting approval |
| `3,5` | `designer_inProgress` | Active designer requests (merged view) |
| `6` | Not tracked | Completed requests (no inbox) |

## How It Works

### User Journey

1. **User navigates to an inbox** (e.g., "Needs Action" with statuses 1,5)
2. **Frontend determines inbox category** using `getInboxCategory()`
3. **API receives inbox category** and fetches last viewed time from `InboxViews` table
4. **Backend calculates IsUnread** for each request:
   - Compares `SubmissionDate` vs `LastViewedAt`
   - Compares latest `RequestHistory.ActionDate` vs `LastViewedAt`
5. **Backend sorts results**: Unread items first, then by date/priority
6. **Frontend displays** with visual indicators:
   - Blue background tint
   - Blue right border
   - "جدید" badge
   - Top of the list

### Marking as Read

When user marks an inbox as viewed (via existing `markInboxAsViewed` mutation):
```typescript
await markInboxAsViewed(inboxCategory);
```

The `InboxViews` table is updated with current timestamp, and subsequent requests to that inbox will show no unread items until new activity occurs.

## Database Schema

### Existing InboxView Entity
```csharp
public class InboxView
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string InboxCategory { get; set; }  // e.g., "requester_underReview"
    public DateTime LastViewedAt { get; set; }  // Timestamp when inbox was last viewed
    public AppUser User { get; set; }
}
```

**No database migration required** - uses existing `InboxViews` table that was already tracking view times.

## API Changes

### Request Response Object
Added `IsUnread` boolean field to request objects returned from GET `/api/requests`:

```json
{
  "id": 123,
  "title": "درخواست نمونه",
  "status": 1,
  "priority": 0,
  "requesterName": "علی احمدی",
  "requesterUsername": "ali.ahmadi",
  "requestTypeName": "پوستر",
  "dueDate": "2025-10-25T00:00:00",
  "isUnread": true  // NEW FIELD
}
```

### Query Parameters
GET `/api/requests` now accepts:
- `statuses[]`: Array of status codes (existing)
- `searchTerm`: Search query (existing)
- `inboxCategory`: Inbox identifier (NEW) - e.g., "designer_pendingAction"

## Performance Considerations

### Query Optimization
- **Single Query**: Fetches all data in one database call
- **In-Memory Calculation**: `IsUnread` computed after fetch to avoid complex SQL joins
- **Indexed Lookups**: `InboxViews` table uses composite index on (UserId, InboxCategory)
- **Selective Loading**: Only includes `LatestHistoryDate` when needed for unread calculation

### Estimated Impact
- **Additional Query**: 1 lightweight lookup to `InboxViews` per request list load
- **Complexity**: O(n) for calculating `IsUnread` flag for n requests
- **Memory**: Minimal - boolean flag per request
- **Network**: +1 byte per request (boolean serialization)

## Testing Scenarios

### Test Case 1: New Request Appears as Unread
1. User views "Needs Action" inbox
2. Backend marks inbox as viewed
3. New request is created with matching statuses
4. User refreshes list
5. **Expected**: New request appears with blue highlight at top

### Test Case 2: Status Change Triggers Unread
1. User views "In Progress" inbox
2. Request status changes from "In Progress" to "Pending Approval"
3. Designer views "In Progress" inbox
4. **Expected**: Recently changed request appears as unread in "Pending Approval" inbox

### Test Case 3: Comment Triggers Unread
1. User views inbox
2. Another user adds comment to request
3. User refreshes inbox
4. **Expected**: Request with new comment appears as unread

### Test Case 4: Mark as Read Clears Unread
1. User sees unread items
2. User clicks "Mark as Read" (existing button)
3. Page refreshes
4. **Expected**: All items now show as read (no blue highlight)

### Test Case 5: Different Inboxes Track Separately
1. User views "Needs Action" inbox (marks as viewed)
2. User navigates to "In Progress" inbox (not yet viewed)
3. **Expected**: "Needs Action" shows no unread, "In Progress" may show unread items

### Test Case 6: Sorting Preserves Unread Priority
1. User has mix of read/unread requests
2. User changes sort order (by priority, status, or date)
3. **Expected**: Unread items always appear first, then sorted within read/unread groups

## Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (all versions from 2023+)
- **Mobile Responsive**: Works on all device sizes with appropriate styling

## Future Enhancements

### Possible Improvements
1. **Unread Count Badge**: Add numeric badge to inbox navigation showing unread count
2. **Auto-Refresh**: Implement WebSocket updates to show new unread items without page reload
3. **Keyboard Navigation**: Add keyboard shortcuts to navigate between unread items
4. **Mark Individual as Read**: Allow marking single items as read without viewing
5. **Persistent Unread State**: Add per-request read tracking instead of inbox-level
6. **Unread Notifications**: Desktop notifications for new unread requests
7. **Smart Unread**: ML-based prediction of which requests user cares about most

### Performance Optimization Ideas
1. **Server-Side Sorting**: Move unread-first sorting to SQL query
2. **Cached Counts**: Cache unread counts in Redis for faster lookups
3. **Incremental Updates**: Only fetch new/changed requests instead of full list
4. **Virtual Scrolling**: Implement virtual scrolling for large lists

## Related Files

### Backend
- `GraphicRequestSystem.API/Controllers/RequestsController.cs` (modified)
- `GraphicRequestSystem.API/Core/Entities/InboxView.cs` (existing, reused)

### Frontend
- `graphic-request-client/src/services/apiSlice.ts` (modified)
- `graphic-request-client/src/pages/RequestsListPage.tsx` (modified)

## Migration Notes

### From Previous Version
No database migration required. Feature uses existing `InboxViews` table.

### Backward Compatibility
- **API**: Old clients will receive `isUnread` field but can ignore it
- **Frontend**: Gracefully handles missing `isUnread` field (defaults to `false`)
- **Database**: No schema changes, fully compatible with existing data

## Known Limitations

1. **Inbox-Level Tracking**: Marks entire inbox as viewed, not individual requests
2. **No Partial Updates**: Refreshing page required to see new unread status
3. **Status-Based Only**: Only tracks predefined inbox categories, not custom views
4. **Single User**: Each user has independent unread state (by design)

## Conclusion

The unread requests feature provides immediate visual feedback to users about new or updated requests in their inbox, improving the user experience by:
- **Reducing Cognitive Load**: Users immediately see what needs attention
- **Improving Efficiency**: No need to manually track which requests are new
- **Enhancing UX**: Clear visual hierarchy with blue highlighting and badges
- **Maintaining Performance**: Lightweight implementation with minimal overhead

The feature integrates seamlessly with the existing inbox tracking system and requires no additional database changes.
