# Bug Fix: Visual Distinction for Unread Requests

## Problem
The backend was correctly calculating and returning `IsUnread` status for each request, but the frontend was not displaying the visual distinction properly. Requests marked as "unread" appeared identical to read requests - no background color change, no border indicator, no "New" badge.

**Root Cause:** The frontend was using **localStorage-based tracking** (`viewedRequests` Set) that overrode the backend's authoritative `isUnread` value. This created a mismatch:

```tsx
// ❌ WRONG - Overriding backend with localStorage
isUnread: request.isUnread && !viewedRequests.has(request.id)
```

The localStorage approach was a remnant from Phase 18, before proper backend tracking was implemented in Phases 19-20.

## Solution
**Removed all localStorage tracking logic** and made the frontend trust the backend's authoritative `isUnread` value. The backend already handles:
- Status-aware tracking (Phase 19)
- Reassignment-aware tracking (Phase 20)
- Timestamp-based comparisons

The frontend should simply **display** what the backend calculates, not recompute it.

## Changes Made

### 1. Removed localStorage State
**File:** `graphic-request-client/src/pages/RequestsListPage.tsx`

**Before:**
```tsx
const [viewedRequests, setViewedRequests] = useState<Set<number>>(new Set());

// Load viewed requests from localStorage on mount
useEffect(() => {
    const stored = localStorage.getItem('viewedRequests');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            setViewedRequests(new Set(parsed));
        } catch (e) {
            console.error('Failed to parse viewed requests:', e);
        }
    }
}, []);
```

**After:**
```tsx
// ✅ Removed entirely - backend is source of truth
```

### 2. Simplified Click Handler
**File:** `graphic-request-client/src/pages/RequestsListPage.tsx`

**Before:**
```tsx
const markRequestAsViewedBoth = async (requestId: number) => {
    // Update localStorage
    setViewedRequests(prev => {
        const updated = new Set(prev);
        updated.add(requestId);
        localStorage.setItem('viewedRequests', JSON.stringify(Array.from(updated)));
        return updated;
    });

    // Update backend
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

**After:**
```tsx
const handleRequestClick = async (requestId: number) => {
    // Mark request as viewed on backend
    try {
        await markRequestAsViewed(requestId).unwrap();
    } catch (error) {
        console.error('Failed to mark request as viewed:', error);
    }
    
    // Navigate to request details
    navigate(`/requests/${requestId}`);
};
```

### 3. Simplified Unread Count
**File:** `graphic-request-client/src/pages/RequestsListPage.tsx`

**Before:**
```tsx
const unreadCount = sortedRequests.filter(r => r.isUnread && !viewedRequests.has(r.id)).length;
```

**After:**
```tsx
const unreadCount = sortedRequests.filter(r => r.isUnread).length;
```

### 4. Direct isUnread Pass-through
**File:** `graphic-request-client/src/pages/RequestsListPage.tsx`

**Before:**
```tsx
<RequestTableRow
    key={request.id}
    request={{
        ...request,
        isUnread: request.isUnread && !viewedRequests.has(request.id)
    }}
    isLast={index === paginatedRequests.length - 1}
    onClick={() => handleRequestClick(request.id)}
/>

<RequestListItem
    key={request.id}
    request={{
        ...request,
        isUnread: request.isUnread && !viewedRequests.has(request.id)
    }}
    onClick={() => handleRequestClick(request.id)}
/>
```

**After:**
```tsx
<RequestTableRow
    key={request.id}
    request={request}
    isLast={index === paginatedRequests.length - 1}
    onClick={() => handleRequestClick(request.id)}
/>

<RequestListItem
    key={request.id}
    request={request}
    onClick={() => handleRequestClick(request.id)}
/>
```

## Visual Indicators (Already Working)

The visual styling was already implemented correctly in the UI components. Once we pass the correct `isUnread` value, these styles now display properly:

### Table Row View (RequestTableRow):
```tsx
sx={{
    bgcolor: isUnread ? alpha(theme.palette.info.main, 0.08) : 'transparent',
    borderRight: isUnread ? `3px solid ${theme.palette.info.main}` : 'none',
    '&:hover': {
        bgcolor: isUnread ? alpha(theme.palette.info.main, 0.12) : alpha(theme.palette.primary.main, 0.02),
    }
}}

{isUnread && (
    <Chip
        label="جدید"
        size="small"
        sx={{
            bgcolor: theme.palette.info.main,
            color: 'white',
            fontWeight: 700,
        }}
    />
)}
```

**Visual Changes:**
- ✅ Light blue background (`alpha(theme.palette.info.main, 0.08)`)
- ✅ Blue border on right side (3px solid)
- ✅ "جدید" (New) badge with blue background
- ✅ Darker background on hover

### Card View (RequestListItem):
```tsx
sx={{
    borderColor: isUnread ? 'info.main' : 'divider',
    bgcolor: isUnread ? alpha(theme.palette.info.main, 0.05) : 'background.paper',
    borderRight: isUnread ? `4px solid ${theme.palette.info.main}` : 'none',
    '&:hover': {
        borderColor: isUnread ? 'info.dark' : 'primary.main',
        boxShadow: isUnread
            ? `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`
            : `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
    }
}}

<Typography
    variant="subtitle1"
    fontWeight={isUnread ? 800 : 700}
    // ...
/>
```

**Visual Changes:**
- ✅ Blue border color
- ✅ Light blue background
- ✅ Blue border on right side (4px solid)
- ✅ Bolder title font (800 vs 700)
- ✅ Blue glow shadow on hover

## Data Flow

### Before (Broken):
```
1. Backend calculates IsUnread = true
2. Frontend receives { id: 5, isUnread: true }
3. Frontend checks localStorage: viewedRequests.has(5) = true
4. Frontend overrides: isUnread = true && !true = FALSE ❌
5. UI shows as read (no visual distinction)
```

### After (Fixed):
```
1. Backend calculates IsUnread = true based on:
   - User never viewed at current status, OR
   - Last change timestamp > user's view timestamp
2. Frontend receives { id: 5, isUnread: true }
3. Frontend uses backend value directly: isUnread = true ✓
4. UI shows visual distinction:
   - Blue background ✓
   - Blue border ✓
   - "جدید" badge ✓
   - Bold text ✓
```

## User Workflow

### Scenario 1: Viewing a New Request
```
1. Admin assigns request to Designer A
   → Backend: IsUnread = true (never viewed at current status)
   
2. Designer A sees request list
   → UI displays with blue background, border, and "جدید" badge ✓
   
3. Designer A clicks request
   → markRequestAsViewed() mutation called
   → Backend saves view record with timestamp
   
4. RTK Query automatically refetches list
   → Backend: IsUnread = false (viewed at current status, no changes since)
   
5. Designer A returns to list
   → UI displays with normal appearance (no blue styling) ✓
```

### Scenario 2: Request Reassigned
```
1. Designer A has already viewed request (IsUnread = false)
   → UI shows normal appearance ✓
   
2. Admin reassigns to Designer B
   → New RequestHistory entry created with fresh timestamp
   
3. Designer A refreshes list
   → Backend: IsUnread = true (last change > user's view timestamp)
   → UI shows blue styling again ✓
   
4. Designer B sees list
   → Backend: IsUnread = true (never viewed at current status)
   → UI shows blue styling ✓
```

## RTK Query Cache Invalidation

The `markRequestAsViewed` mutation automatically triggers refetch:

```typescript
markRequestAsViewed: builder.mutation<void, number>({
    query: (requestId) => ({
        url: `/requests/${requestId}/mark-viewed`,
        method: 'POST'
    }),
    invalidatesTags: (result, error, requestId) => [
        { type: 'Request', id: requestId },  // Invalidate specific request
        { type: 'Request', id: 'LIST' },     // Invalidate entire list
        'InboxCounts'                         // Invalidate badge counts
    ]
})
```

**This means:**
1. User clicks request → mutation fires
2. Backend updates RequestView table
3. Frontend automatically refetches request list
4. New list has updated IsUnread values
5. UI re-renders with correct styling
6. Badge counts update automatically

**No manual refresh needed!**

## Benefits

✅ **Single Source of Truth**: Backend is authoritative for read/unread status  
✅ **No State Synchronization**: No need to keep localStorage in sync with backend  
✅ **Cross-Device Consistency**: Read status persists across devices and sessions  
✅ **Handles Complex Scenarios**: Status changes and reassignments work correctly  
✅ **Automatic Updates**: RTK Query cache invalidation keeps UI fresh  
✅ **Visual Clarity**: Users can immediately see which requests need attention  

## Testing Checklist

- [x] Remove localStorage state and useEffect
- [x] Simplify click handler to only call backend
- [x] Remove localStorage check from unread count
- [x] Pass backend's isUnread directly to components
- [x] Verify visual styling is in place (already was)
- [x] Verify RTK Query invalidation triggers refetch (already configured)

## What Was NOT Changed

- ✅ Backend logic (already working correctly)
- ✅ UI styling components (already implemented correctly)
- ✅ RTK Query configuration (already set up correctly)
- ✅ Database schema (no changes needed)

## Related Fixes

- **Phase 18**: Initial per-request view tracking (created RequestView entity)
- **Phase 19**: Status-aware tracking (ViewedAtStatus field)
- **Phase 20**: Reassignment-aware tracking (timestamp comparison)
- **Phase 21 (This)**: Fixed frontend to display backend's values correctly

## Notes

- localStorage was completely removed - no migration needed for users
- Users may see previously-read requests as unread after this fix (expected behavior - backend is now source of truth)
- Visual distinction works in both table view and card view
- No backend changes were required for this fix
- TypeScript warnings about `any` types are pre-existing and unrelated
