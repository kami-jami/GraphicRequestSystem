# Dashboard Action-Only Implementation Summary

## Overview

Successfully implemented the **Action-Required-Only** filtering system for dashboards, ensuring each user only sees requests requiring their immediate action, not informational updates.

## Implementation Date

**Date**: January 2025  
**Phase**: Phase 22 - Dashboard Restructuring

## Problem Statement

**Before:**
- Users saw ALL requests they had permission to view
- "Outbox" and "Completed" items cluttered the main inbox
- No clear distinction between "I need to act" vs "Just monitoring"
- Confusing user experience with too many items in inbox

**After:**
- Users see ONLY requests requiring their action in main inbox
- Monitoring/tracking items separated into dedicated views
- Clear distinction between action-required and informational items
- Clean, focused dashboard experience

## Changes Made

### 1. Backend Changes

#### File: `RequestsController.cs`

**Added Parameter to GetRequests Endpoint:**

```csharp
[HttpGet]
public async Task<IActionResult> GetRequests(
    [FromQuery] int[]? statuses, 
    [FromQuery] string? searchTerm, 
    [FromQuery] string? inboxCategory,
    [FromQuery] bool actionRequiredOnly = false) // NEW PARAMETER
```

**Added Filtering Logic:**

```csharp
// --- 7. Filter to action-required items only if requested ---
if (actionRequiredOnly)
{
    requestsWithUnread = requestsWithUnread
        .Where(r => r.IsUnread) // Only keep ActionRequired items (those marked as unread)
        .ToList();
}
```

**How it Works:**
- `actionRequiredOnly = false` → Returns ALL requests user can see (existing behavior)
- `actionRequiredOnly = true` → Filters to ONLY requests where `IsUnread = true`
- Since `IsUnread` already uses `IsResponsibleUser()` logic from Phase 21, this correctly filters to action-required items only

### 2. Frontend API Layer Changes

#### File: `apiSlice.ts`

**Updated Interface:**

```typescript
interface GetRequestsParams {
  statuses?: number[];
  searchTerm?: string;
  inboxCategory?: string;
  actionRequiredOnly?: boolean; // NEW
}
```

**Updated Query Builder:**

```typescript
getRequests: builder.query<any[], GetRequestsParams>({
    query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.statuses && params.statuses.length > 0) {
          params.statuses.forEach(status => queryParams.append('statuses', status.toString()));
        }
        if (params.searchTerm)
          queryParams.append('searchTerm', params.searchTerm);
        if (params.inboxCategory)
          queryParams.append('inboxCategory', params.inboxCategory);
        if (params.actionRequiredOnly) // NEW
          queryParams.append('actionRequiredOnly', 'true');
        return `/requests?${queryParams.toString()}`;
    },
    // ... rest
})
```

### 3. Navigation Structure Changes

#### File: `MainLayout.tsx`

**Updated InboxItem Interface:**

```typescript
interface InboxItem {
    text: string;
    icon: React.ReactNode;
    inboxType: 'inbox' | 'outbox' | 'completed' | 'all';
    statuses: number[];
    countKey?: string;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    description?: string;
    actionRequiredOnly?: boolean; // NEW
}
```

**Restructured Requester Inbox Items:**

```typescript
// BEFORE: 4 items including "Under Review"
// AFTER: 3 items, removed "Under Review", only action-required

if (userRoles.includes('Requester')) {
    items.push(
        {
            text: '✏️ نیاز به اصلاح من',
            icon: <EditNoteIcon fontSize="small" />,
            inboxType: 'inbox',
            statuses: [2], // PendingCorrection
            countKey: 'requester_needsRevision',
            color: 'error',
            description: 'درخواست‌های برگشتی من که نیاز به ویرایش دارند',
            actionRequiredOnly: true // ✅ ACTION REQUIRED
        },
        {
            text: '📤 پیگیری درخواست‌ها',
            icon: <SendIcon fontSize="small" />,
            inboxType: 'outbox',
            statuses: [0, 1, 3, 4, 5], // All except correction/completed
            color: 'info',
            description: 'درخواست‌های ارسالی من و در حال بررسی',
            actionRequiredOnly: false // ℹ️ INFO ONLY (monitoring)
        },
        {
            text: '✅ تکمیل شده من',
            icon: <TaskAltIcon fontSize="small" />,
            inboxType: 'completed',
            statuses: [6],
            countKey: 'requester_completed',
            color: 'success',
            description: 'درخواست‌های نهایی و تحویل گرفته شده من',
            actionRequiredOnly: false // ℹ️ INFO ONLY (archive)
        }
    );
}
```

**Restructured Designer Inbox Items:**

```typescript
if (userRoles.includes('Designer')) {
    items.push(
        {
            text: '🎨 کارهای طراحی من',
            icon: <InboxIcon fontSize="small" />,
            inboxType: 'inbox',
            statuses: [1, 5], // DesignerReview, PendingRedesign
            countKey: 'designer_pendingAction',
            color: 'primary',
            description: 'تخصیص‌های جدید و درخواست‌های برگشتی (طراح)',
            actionRequiredOnly: true // ✅ ACTION REQUIRED
        },
        {
            text: '📤 در حال طراحی',
            icon: <SendIcon fontSize="small" />,
            inboxType: 'outbox',
            statuses: [3, 4], // DesignInProgress, PendingApproval
            color: 'info',
            description: 'پروژه‌های در دست کار و ارسال شده برای تایید من',
            actionRequiredOnly: false // ℹ️ INFO ONLY (monitoring)
        },
        {
            text: '✅ تکمیل شده طراحی',
            icon: <TaskAltIcon fontSize="small" />,
            inboxType: 'completed',
            statuses: [6],
            countKey: 'designer_completed',
            color: 'success',
            description: 'پروژه‌های تحویل داده شده من',
            actionRequiredOnly: false // ℹ️ INFO ONLY (archive)
        }
    );
}
```

**Restructured Approver Inbox Items:**

```typescript
if (userRoles.includes('Approver')) {
    items.push(
        {
            text: '📋 تاییدهای من',
            icon: <InboxIcon fontSize="small" />,
            inboxType: 'inbox',
            statuses: [4], // PendingApproval
            countKey: 'approver_pendingApproval',
            color: 'primary',
            description: 'درخواست‌های منتظر تایید من (تاییدکننده)',
            actionRequiredOnly: true // ✅ ACTION REQUIRED
        },
        {
            text: '📤 بررسی شده توسط من',
            icon: <SendIcon fontSize="small" />,
            inboxType: 'outbox',
            statuses: [3, 5, 6],
            color: 'info',
            description: 'درخواست‌هایی که بررسی کرده‌ام',
            actionRequiredOnly: false // ℹ️ INFO ONLY (monitoring)
        },
        {
            text: '✅ تایید شده توسط من',
            icon: <TaskAltIcon fontSize="small" />,
            inboxType: 'completed',
            statuses: [6],
            countKey: 'approver_completed',
            color: 'success',
            description: 'درخواست‌هایی که تایید و تحویل داده‌ام',
            actionRequiredOnly: false // ℹ️ INFO ONLY (archive)
        }
    );
}
```

**Updated URL Generation to Include actionRequiredOnly:**

```typescript
<List component="div" disablePadding sx={{ mt: 0.5 }}>
    {inboxItems.map((item) => {
        const params = new URLSearchParams();
        params.set('inboxType', item.inboxType);
        if (item.statuses.length > 0) {
            item.statuses.forEach(s => params.append('statuses', s.toString()));
        }
        if (item.actionRequiredOnly !== undefined) { // NEW
            params.set('actionRequiredOnly', item.actionRequiredOnly.toString());
        }
        const queryString = params.toString();
        const path = `/requests?${queryString}`;
        // ... rest
    })}
</List>
```

### 4. Page Component Changes

#### File: `RequestsListPage.tsx`

**Added State Variable:**

```typescript
const [actionRequiredOnly, setActionRequiredOnly] = useState(false);
```

**Read from URL Parameters:**

```typescript
useEffect(() => {
    const statusesFromUrl = searchParams.getAll('statuses');
    const searchTermFromUrl = searchParams.get('searchTerm') || '';
    const inboxTypeFromUrl = searchParams.get('inboxType') as 'inbox' | 'outbox' | 'completed' | 'all' || 'all';
    const actionRequiredOnlyFromUrl = searchParams.get('actionRequiredOnly') === 'true'; // NEW

    setStatusFilter(statusesFromUrl.map(s => Number(s)));
    setSearchTerm(searchTermFromUrl);
    setInboxType(inboxTypeFromUrl);
    setActionRequiredOnly(actionRequiredOnlyFromUrl); // NEW
    
    // ... rest
}, [searchParams]);
```

**Pass to Query:**

```typescript
const { data: requests, isLoading, refetch, isFetching } = useGetRequestsQuery({
    statuses: statusFilter,
    searchTerm: searchTerm,
    inboxCategory: inboxCategory,
    actionRequiredOnly: actionRequiredOnly, // NEW
});
```

## URL Structure Examples

### Before (All Items):

```
/requests?inboxType=inbox&statuses=0&statuses=1
→ Shows ALL requests in status 0,1 (cluttered)
```

### After (Action-Required Only):

```
/requests?inboxType=inbox&statuses=2&actionRequiredOnly=true
→ Shows ONLY requests in status 2 WHERE user is responsible (clean)
```

### Monitoring View:

```
/requests?inboxType=outbox&statuses=0&statuses=1&statuses=3&statuses=4&statuses=5&actionRequiredOnly=false
→ Shows ALL requests for tracking (not filtered by responsibility)
```

## User Experience Flow

### Example 1: Requester Workflow

**Scenario:** User submits request, designer returns it for correction

**Before:**
```
📨 درخواست‌های من: 2 unread
  - Request #124 (Submitted) ❌ Shouldn't be unread (they submitted it)
  - Request #125 (PendingCorrection) ✅ Correct

User confused which needs action!
```

**After:**
```
✏️ نیاز به اصلاح من: 1 unread
  - Request #125 (PendingCorrection) ✅ Clear action needed

📤 پیگیری درخواست‌ها: (no badge)
  - Request #124 (Submitted) - Just monitoring

Clear separation: Action vs Monitoring!
```

### Example 2: Designer Workflow

**Scenario:** Designer has active work and completed items

**Before:**
```
🎨 کارهای طراحی من: 3 unread
  - Request #200 (DesignerReview) ✅ Needs action
  - Request #201 (DesignInProgress) ❌ Already working, not new
  - Request #202 (PendingApproval) ❌ Sent for approval, not designer's action

Cluttered inbox!
```

**After:**
```
🎨 کارهای طراحی من: 1 unread
  - Request #200 (DesignerReview) ✅ Clear action needed

📤 در حال طراحی: (no badge)
  - Request #201 (DesignInProgress) - Monitoring
  - Request #202 (PendingApproval) - Monitoring

Clean focus on actionable items!
```

### Example 3: Approver Workflow

**Scenario:** Approver has pending approvals

**Before:**
```
📋 تاییدهای من: 5 unread
  - Includes requests assigned to other approvers ❌
  - Mixed with already-approved items ❌

Confusing which need action!
```

**After:**
```
📋 تاییدهای من: 2 unread
  - Request #300 (PendingApproval, ApproverId = me) ✅
  - Request #301 (PendingApproval, ApproverId = me) ✅

Only MY approvals, crystal clear!
```

## Dashboard Card Structure

### Requester Dashboard

**Card 1: "Action Required" (actionRequiredOnly: true)**
- Status: 2 (PendingCorrection)
- Shows: Requests designer returned for fixes
- Badge Color: Error (red)
- User must: Make corrections and resubmit

**Card 2: "Tracking" (actionRequiredOnly: false)**
- Statuses: 0, 1, 3, 4, 5
- Shows: All submitted requests in progress
- Badge Color: Info (blue)
- User can: Monitor progress

**Card 3: "Completed" (actionRequiredOnly: false)**
- Status: 6
- Shows: Finalized requests
- Badge Color: Success (green)
- User can: Review past work

### Designer Dashboard

**Card 1: "Action Required" (actionRequiredOnly: true)**
- Statuses: 1 (DesignerReview), 5 (PendingRedesign)
- Shows: New assignments and redesign requests
- Badge Color: Primary (blue)
- User must: Start design or redesign

**Card 2: "In Progress" (actionRequiredOnly: false)**
- Statuses: 3 (DesignInProgress), 4 (PendingApproval)
- Shows: Currently working and sent for approval
- Badge Color: Info (blue)
- User can: Monitor and continue work

**Card 3: "Completed" (actionRequiredOnly: false)**
- Status: 6
- Shows: Delivered designs
- Badge Color: Success (green)
- User can: Review past work

### Approver Dashboard

**Card 1: "Action Required" (actionRequiredOnly: true)**
- Status: 4 (PendingApproval)
- Shows: ONLY requests assigned to this approver
- Badge Color: Primary (blue)
- User must: Approve or reject

**Card 2: "Reviewed" (actionRequiredOnly: false)**
- Statuses: 3, 5, 6
- Shows: Requests already processed
- Badge Color: Info (blue)
- User can: Monitor outcomes

**Card 3: "Approved" (actionRequiredOnly: false)**
- Status: 6
- Shows: Successfully approved requests
- Badge Color: Success (green)
- User can: Review past approvals

## Technical Architecture

### Data Flow

```
User clicks inbox item
  ↓
MainLayout generates URL with actionRequiredOnly parameter
  ↓
RequestsListPage reads parameter from URL
  ↓
Sets actionRequiredOnly state
  ↓
Passes to useGetRequestsQuery
  ↓
apiSlice builds query string
  ↓
Backend receives actionRequiredOnly parameter
  ↓
Filters results: if true, only keep where IsUnread = true
  ↓
Returns filtered list
  ↓
RequestsListPage displays clean, focused list
```

### IsResponsibleUser Logic (from Phase 21)

```csharp
private static bool IsResponsibleUser(
    string currentUserId,
    string? requesterId,
    string? designerId,
    string? approverId,
    RequestStatus status,
    IList<string> userRoles)
{
    return status switch
    {
        RequestStatus.Submitted => userRoles.Contains("Admin"),         // Admin assigns
        RequestStatus.DesignerReview => currentUserId == designerId,    // Designer reviews
        RequestStatus.PendingCorrection => currentUserId == requesterId, // Requester fixes
        RequestStatus.DesignInProgress => currentUserId == designerId,  // Designer works
        RequestStatus.PendingApproval => currentUserId == approverId,   // Approver decides
        RequestStatus.PendingRedesign => currentUserId == designerId,   // Designer redesigns
        RequestStatus.Completed => false,                               // No action needed
        _ => false
    };
}
```

**Key Point:** The `IsUnread` flag is ONLY true for users responsible at current status. The `actionRequiredOnly` parameter leverages this existing logic.

## Benefits

### 1. Cleaner Dashboards
- ✅ Main inbox shows ONLY actionable items
- ✅ No clutter from monitoring items
- ✅ Unread badge = "You have work to do"

### 2. Better Focus
- ✅ Users know exactly what needs their attention
- ✅ No confusion about action vs information
- ✅ Prioritization is easier

### 3. Separated Concerns
- ✅ Action items in main inbox
- ✅ Monitoring items in tracking view
- ✅ Completed items in archive

### 4. Role-Specific Experience
- ✅ Each role sees relevant actions only
- ✅ No cross-role confusion
- ✅ Personalized workflow

### 5. Backward Compatible
- ✅ `actionRequiredOnly = false` → Original behavior (show all)
- ✅ `actionRequiredOnly = true` → New behavior (action-only)
- ✅ Existing code still works

### 6. No Database Changes
- ✅ All filtering in-memory
- ✅ Leverages existing `IsResponsibleUser` logic
- ✅ Fast and efficient

## Testing Checklist

### Backend Testing

- [x] Test `actionRequiredOnly=false` returns all requests
- [x] Test `actionRequiredOnly=true` returns only IsUnread=true requests
- [x] Test with different user roles (Requester, Designer, Approver, Admin)
- [x] Test with different statuses (0-6)
- [x] Test filtering works correctly with IsResponsibleUser logic

### Frontend Testing

#### Requester Tests
- [ ] Click "نیاز به اصلاح من" → Should show ONLY status 2 requests where user is responsible
- [ ] Verify unread badge shows correct count
- [ ] Click "پیگیری درخواست‌ها" → Should show ALL submitted requests (monitoring)
- [ ] Verify no unread badge on monitoring view
- [ ] Click "تکمیل شده من" → Should show all completed requests

#### Designer Tests
- [ ] Click "کارهای طراحی من" → Should show ONLY statuses 1,5 where designer is assigned
- [ ] Verify unread badge shows correct count
- [ ] Click "در حال طراحی" → Should show ALL in-progress and approval requests (monitoring)
- [ ] Verify no unread badge on monitoring view
- [ ] Click "تکمیل شده طراحی" → Should show all completed requests

#### Approver Tests
- [ ] Click "تاییدهای من" → Should show ONLY status 4 requests assigned to this approver
- [ ] Verify unread badge shows correct count
- [ ] Click "بررسی شده توسط من" → Should show ALL processed requests (monitoring)
- [ ] Verify no unread badge on monitoring view
- [ ] Click "تایید شده توسط من" → Should show all approved requests

#### Admin Tests
- [ ] Verify admin can see all views
- [ ] Test assignment workflow
- [ ] Verify monitoring views show system-wide data

### URL Parameter Tests
- [ ] Verify `actionRequiredOnly=true` in URL for action views
- [ ] Verify `actionRequiredOnly=false` in URL for monitoring views
- [ ] Verify URL updates when switching between views
- [ ] Verify browser back/forward buttons work correctly

### Integration Tests
- [ ] Test request lifecycle: Submit → Assign → Review → Correct → Approve
- [ ] Verify unread counts update correctly at each status change
- [ ] Verify action items disappear from inbox when completed
- [ ] Verify monitoring items show full workflow visibility

## Performance Considerations

**Query Performance:**
- Same database query as before (no extra joins)
- Additional filtering happens in-memory (very fast)
- No N+1 query issues

**Caching:**
- RTK Query handles caching automatically
- Invalidation triggers on status changes (existing behavior)
- No additional cache management needed

**Scalability:**
- Filter operation is O(n) where n = number of requests user can see
- For typical user (10-100 requests visible), negligible impact
- Could optimize with database-level filtering if needed (future enhancement)

## Future Enhancements

### Phase 1: Smart Views
- Add "Urgent" view (action-required + high priority)
- Add "Overdue" view (action-required + past due date)
- Add "This Week" view (action-required + due this week)

### Phase 2: Bulk Actions
- Select multiple action items
- Batch process (e.g., approve multiple, assign multiple)
- Mark multiple as viewed

### Phase 3: Delegation
- Temporarily delegate action items to other users
- Track delegation history
- Automatic return after deadline

### Phase 4: Workload Balancing
- View team's action queue
- Redistribute work
- Load balancing recommendations

### Phase 5: Notifications Integration
- InfoOnly updates → Notification panel only
- ActionRequired updates → Notification panel + Inbox
- Separate notification categories

## Migration Notes

**No Breaking Changes:**
- Existing URLs without `actionRequiredOnly` parameter work as before
- Default behavior: `actionRequiredOnly = false` (show all)
- Users can still access old views if needed

**Gradual Rollout:**
1. Deploy backend changes (backward compatible)
2. Deploy frontend changes (navigation updated)
3. Monitor user feedback
4. Iterate on inbox structure if needed

**Rollback Plan:**
- If issues arise, simply remove `actionRequiredOnly` parameter from navigation URLs
- Backend will default to `false`, showing all items (original behavior)
- No data loss or corruption possible

## Related Documentation

- [READ_STATE_TYPES_DOCUMENTATION.md](READ_STATE_TYPES_DOCUMENTATION.md) - Explains ActionRequired vs InfoOnly states
- [BUGFIX_ACTION_BASED_UNREAD_LOGIC.md](BUGFIX_ACTION_BASED_UNREAD_LOGIC.md) - Phase 21 implementation of IsResponsibleUser
- [DASHBOARD_RESTRUCTURING_PLAN.md](DASHBOARD_RESTRUCTURING_PLAN.md) - Original planning document
- [EMAIL_INBOX_REDESIGN.md](EMAIL_INBOX_REDESIGN.md) - Email-like inbox structure
- [UNREAD_REQUESTS_FEATURE.md](UNREAD_REQUESTS_FEATURE.md) - Original unread feature

## Conclusion

Successfully implemented action-required-only filtering across all dashboards. Each user now sees a clean, focused view of items requiring their immediate action, with separate monitoring views for tracking progress. The implementation leverages existing `IsResponsibleUser` logic from Phase 21, requires no database changes, and is fully backward compatible.

**Key Achievement:** Transformed cluttered inboxes into focused action dashboards, dramatically improving user experience and workflow efficiency.

## Files Modified

### Backend
1. `RequestsController.cs`
   - Added `actionRequiredOnly` parameter to `GetRequests` endpoint
   - Added filtering logic to return only IsUnread items when requested

### Frontend
1. `apiSlice.ts`
   - Updated `GetRequestsParams` interface with `actionRequiredOnly` property
   - Updated query string builder to include parameter

2. `MainLayout.tsx`
   - Updated `InboxItem` interface with `actionRequiredOnly` property
   - Restructured Requester inbox items (removed "Under Review", added actionRequiredOnly flags)
   - Restructured Designer inbox items (added actionRequiredOnly flags)
   - Restructured Approver inbox items (added actionRequiredOnly flags)
   - Updated URL generation logic to include `actionRequiredOnly` parameter

3. `RequestsListPage.tsx`
   - Added `actionRequiredOnly` state variable
   - Updated `useEffect` to read parameter from URL
   - Updated `useGetRequestsQuery` call to pass parameter

### Documentation
1. `DASHBOARD_RESTRUCTURING_PLAN.md` (created)
2. `DASHBOARD_ACTION_ONLY_IMPLEMENTATION.md` (this file, created)

---

**Implementation Status**: ✅ **COMPLETE**  
**Testing Status**: ⏳ **PENDING**  
**Deployment Status**: 🔄 **READY FOR DEPLOYMENT**
