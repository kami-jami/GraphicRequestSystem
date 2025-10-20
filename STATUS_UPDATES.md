# Status Updates - Request List Page

## Changes Made

### 1. Status Label Unification ✅
**Issue**: Status labe**Impact**:
- Cleaner UI - action boxes only appear when relevant
- Better UX - users viewing requests they can't act on won't see empty action boxes
- Consistent with approver view (which already had conditional rendering pattern)

### October 19, 2025 - Enhanced Search Functionality

**Issue**: Search box on the Requests List page only searched by request title, limiting users' ability to find requests by other criteria.

**Solution**: Expanded backend search to include multiple fields and updated frontend placeholder to reflect enhanced capabilities.

**Backend Changes** (`RequestsController.cs` - Lines ~81-91):
```csharp
if (!string.IsNullOrEmpty(searchTerm))
{
    query = query.Where(r => 
        r.Title.Contains(searchTerm) ||
        (r.Requester.FirstName != null && r.Requester.FirstName.Contains(searchTerm)) ||
        (r.Requester.LastName != null && r.Requester.LastName.Contains(searchTerm)) ||
        (r.Requester.UserName != null && r.Requester.UserName.Contains(searchTerm)) ||
        r.RequestType.Value.Contains(searchTerm) ||
        r.Id.ToString().Contains(searchTerm)
    );
}
```

**Frontend Changes** (`RequestsListPage.tsx` - Line ~169):
- Updated placeholder text to: "جستجو بر اساس عنوان، شناسه، نوع درخواست یا نام درخواست‌دهنده..."

**Search Fields**:
1. **Request Title** - Main title of the request
2. **Request ID** - Numeric identifier (e.g., "99" or "#99")
3. **Request Type** - Type name (e.g., "لیبل", "بسته‌بندی", etc.)
4. **Requester First Name** - First name of person who created the request
5. **Requester Last Name** - Last name of person who created the request
6. **Requester Username** - Username of the requester

**Impact**:
- **More flexible search**: Users can find requests by ID, type, or requester name
- **Improved efficiency**: Faster request location without needing exact title
- **Better UX**: Search placeholder clearly indicates all searchable fields
- **Case-insensitive**: All searches work regardless of case

**Example Searches**:
- `"99"` - Finds request #99 and any requests with 99 in title/requester
- `"لیبل"` - Finds all label requests
- `"کامیار"` - Finds all requests by requester named Kamyar
- `"تست"` - Finds all requests with "تست" in title

## Technical Notese inconsistent - "ثبت شده" (Registered) and "تخصیص داده شده" (Assigned) appeared as separate statuses.

**Solution**: Updated `STATUS_CONFIG` to show both statuses 0 and 1 as "در حال بررسی" (Under Review):

```typescript
const STATUS_CONFIG = {
    0: { label: 'در حال بررسی', color: 'info', bgColor: '#dbeafe' },    // Previously: 'ثبت شده'
    1: { label: 'در حال بررسی', color: 'info', bgColor: '#dbeafe' },    // Previously: 'تخصیص داده شده'
    2: { label: 'طراحی شده', color: 'secondary', bgColor: '#f3e8ff' },
    3: { label: 'تایید شده', color: 'success', bgColor: '#dcfce7' },
    4: { label: 'رد شده', color: 'error', bgColor: '#fee2e2' },
    5: { label: 'لغو شده', color: 'default', bgColor: '#f5f5f5' },
    6: { label: 'بازگشت داده شده', color: 'warning', bgColor: '#fef3c7' },
};
```

**Impact**:
- Users now see consistent "در حال بررسی" label for both registered and assigned requests
- Filter menu has combined "Under Review" option that includes both statuses
- Maintains separate tracking in backend (statuses 0 and 1) while presenting unified label to users

### 2. Request Type Display Fix ✅
**Issue**: Request type was showing as "undefined" or "نامشخص" (Unknown) in the list view.

**Root Cause**: The backend API's `GetRequests` endpoint was not including the request type information in the response. It only returned:
- Id, Title, Status, Priority, RequesterName, RequesterUsername, DueDate

But was missing:
- RequestTypeName

**Solution - Backend Fix**: Updated `RequestsController.cs` in the `GetRequests` method:

```csharp
// Added .Include(r => r.RequestType) to load the navigation property
var requests = await query
    .Include(r => r.Requester)
    .Include(r => r.RequestType)  // ← Added this
    .Select(r => new
    {
        r.Id,
        r.Title,
        r.Status,
        r.Priority,
        RequesterName = (r.Requester.FirstName + " " + r.Requester.LastName).Trim() != ""
            ? r.Requester.FirstName + " " + r.Requester.LastName
            : r.Requester.UserName,
        RequesterUsername = r.Requester.UserName,
        RequestTypeName = r.RequestType.Value,  // ← Added this
        r.DueDate
    })
    .ToListAsync();
```

**Solution - Frontend Fallback**: Also added a robust fallback chain in `RequestsListPage.tsx`:

```typescript
{request.requestTypeName || request.requestType?.name || request.requestType || 'نامشخص'}
```

**Locations Updated**:
1. **Table View** (Line ~554): Request type column in the main table
2. **Card View** (Line ~700): Request type badge in alternative card layout
3. **List View** (Line ~813): Request type metadata in list item view

**Impact**:
- Request type now displays correctly regardless of backend API structure
- Graceful fallback to "نامشخص" (Unknown) if property is missing
- Works with nested objects, direct strings, or named properties

## Testing Checklist

- [ ] Status labels show "در حال بررسی" for both registered (0) and assigned (1) requests
- [ ] Filter menu "Under Review" option selects both status 0 and 1
- [ ] Request type displays correctly in table view
- [ ] Request type displays correctly in card view (if used)
- [ ] Request type displays correctly in list view
- [ ] "نامشخص" appears only when request type is truly missing
- [ ] **Action boxes only show when user has actions to perform**
- [ ] **No action box appears for completed requests (status 6)**
- [ ] **No action box for users viewing requests they can't act on**

## Changes Log

### October 19, 2025 - Action Box Visibility Fix

**Issue**: Action boxes were displayed on the request detail page even when users had no actions to perform.

**Solution**: Updated `RequestActions.tsx` and `RequestDetailPage.tsx` to check if the user has available actions before rendering action boxes.

**Changes Made**:

1. **RequestActions.tsx** (Lines ~148-161):
   - Added `hasActions` check before rendering the action box
   - Returns `null` if user has no available actions
   - Checks conditions: designer actions (status 1, 3, 5), approver actions (status 4), requester actions (status 2)

2. **RequestDetailPage.tsx** (Lines ~152-161):
   - Added same `hasActions` calculation
   - Updated sticky action box condition to include `hasActions` check
   - Action box only renders when: `!isApproverView && hasActions`

**Action Box Display Logic**:
```typescript
const hasActions = user && (
    (request.status === 1 && user.id === request.designerId) ||  // Start design
    ((request.status === 3 || request.status === 5) && user.id === request.designerId) ||  // Complete/send for approval
    (request.status === 4 && user.id === request.approverId) ||  // Approve/reject
    (request.status === 2 && user.id === request.requesterId)  // Edit/resubmit
);
```

**Impact**:
- Cleaner UI - action boxes only appear when relevant
- Better UX - users viewing requests they can't act on won't see empty action boxes
- Consistent with approver view (which already had conditional rendering)

## Technical Notes

### Status Configuration
The `STATUS_CONFIG` object is centralized at the top of `RequestsListPage.tsx` (lines 43-51). Any future status label changes should be made there to ensure consistency across:
- Status chips in table
- Filter menu labels
- Card/list view badges

### Request Type Property Access
The fallback chain handles three scenarios:
1. **Standard**: `request.requestTypeName` - Direct property (preferred)
2. **Nested**: `request.requestType?.name` - Nested object with name property
3. **Direct**: `request.requestType` - String value directly in requestType
4. **Missing**: `'نامشخص'` - Fallback when all above are undefined

### Backend API Considerations
If the issue persists, check the backend API response:
- Endpoint: `GET /requests?statuses=...&searchTerm=...`
- Verify the response includes request type information
- Consider adding proper TypeScript types in `apiSlice.ts` instead of `any[]`

## Related Files
- `graphic-request-client/src/pages/RequestsListPage.tsx` - Frontend display with fallback chain
- `graphic-request-client/src/pages/RequestDetailPage.tsx` - Uses same property names
- `graphic-request-client/src/services/apiSlice.ts` - API endpoint definition
- `GraphicRequestSystem.API/Controllers/RequestsController.cs` - **Updated GetRequests method** to include RequestTypeName
- `GraphicRequestSystem.API/Core/Entities/LookupItem.cs` - Contains the `Value` property used for request type name

## Backend Changes
**File**: `GraphicRequestSystem.API/Controllers/RequestsController.cs`
**Method**: `GetRequests` (Line ~60-77)
**Changes**:
1. Added `.Include(r => r.RequestType)` to eager load the RequestType navigation property
2. Added `RequestTypeName = r.RequestType.Value` to the anonymous object returned

**Note**: The LookupItem entity uses `Value` property (not `Name`) to store the display text.

---

### October 19, 2025 - Email-Like Inbox Redesign 📧

**Issue**: The request list page used status-based navigation which was confusing for users. Users didn't have a clear understanding of "inbox" vs "outbox" vs "completed" items. The unread visual indicators were too subtle and easy to miss.

**Solution**: Completely redesigned the navigation and request list pages to follow an email client UX pattern (like Gmail/Outlook). Implemented Inbox/Outbox/Completed structure with enhanced visual distinction for unread items.

**Major Changes**:

1. **Navigation Structure** (`MainLayout.tsx`):
   - **Before**: Status-based items (در حال بررسی, نیاز به اصلاح, منتظر تایید, etc.)
   - **After**: Email-like categories:
     - 📥 **صندوق ورودی (Inbox)** - New incoming requests
     - 📤 **ارسال شده / در حال انجام (Outbox)** - Sent/active requests
     - ✅ **تکمیل شده (Completed)** - Finished requests
     - 📂 **همه درخواست‌ها (All)** - All requests
   - Added `inboxType` property to InboxItem interface
   - Updated URL generation to include `inboxType` parameter
   - Role-specific inbox categories for Requester, Designer, Approver

2. **Enhanced Unread Visual Indicators** (`RequestsListPage.tsx`):
   - **Bold text** for unread titles (fontWeight 700 vs 600)
   - **Blue background tint** (`alpha(theme.palette.info.main, 0.08)`)
   - **4px left border** in primary blue color
   - **"جدید" badge** displayed prominently
   - **Always sorted to top** of the list (unread first)
   - Enhanced hover effects for better interactivity

3. **Smart Page Titles**:
   - Inbox: "📥 صندوق ورودی"
   - Outbox: "📤 ارسال شده" (role-specific text)
   - Completed: "✅ تکمیل شده"
   - All: "همه درخواست‌ها"

4. **Unread Counter in Subtitle**:
   - Shows total requests
   - Displays unread count when present: "12 درخواست (5 خوانده نشده)"
   - Real-time calculation based on backend + localStorage tracking

5. **Contextual Info Alert**:
   - Appears when unread items exist in inbox
   - Explains: "شما 5 درخواست خوانده نشده دارید..."
   - Guides users on how read/unread tracking works
   - Blue info style with `FiberManualRecordIcon`

6. **Enhanced Empty States**:
   - **Inbox Empty**: "📥 صندوق ورودی خالی است"
   - **Outbox Empty**: "📤 هیچ درخواست ارسالی ندارید" + "Create New" button
   - **Completed Empty**: "✅ هیچ درخواست تکمیل شده‌ای ندارید"
   - Context-aware messages guide users appropriately

7. **Mobile Responsive Enhancements**:
   - Same unread indicators work in card view
   - Enhanced borders and backgrounds
   - Bold text for unread items
   - Touch-friendly interactions

**Technical Implementation**:

```typescript
// MainLayout.tsx - New inbox item structure
interface InboxItem {
    text: string;
    icon: React.ReactNode;
    inboxType: 'inbox' | 'outbox' | 'completed' | 'all';  // NEW
    statuses: number[];
    countKey?: string;
    color?: ...;
    description?: string;
}

// RequestsListPage.tsx - New state and logic
const [inboxType, setInboxType] = useState<'inbox' | 'outbox' | 'completed' | 'all'>('all');
const unreadCount = sortedRequests.filter(r => r.isUnread && !viewedRequests.has(r.id)).length;
```

**Role-Based Inbox Configuration**:

| Role | Inbox Statuses | Outbox Statuses | Completed |
|------|----------------|-----------------|-----------|
| **Requester** | 0, 1, 2 | 0, 1, 2, 3, 4, 5 | 6 |
| **Designer** | 1, 5 | 3, 4 | 6 |
| **Approver** | 4 | 3, 5, 6 | 6 |
| **Admin** | 1, 2, 3, 4, 5 | - | 6 |

**URL Structure**:
- Before: `/requests?statuses=0&statuses=1`
- After: `/requests?inboxType=inbox&statuses=0&statuses=1`

**Visual Indicators for Unread Requests**:
1. Blue background tint (#EBF5FB)
2. 4px solid left border (primary blue)
3. Bold title text (fontWeight 700)
4. "جدید" chip badge (blue)
5. Always sorted to top

**Impact**:
- **Instant Recognition**: Email metaphor is universally understood
- **Clear Organization**: Users know exactly where to look
- **Visual Clarity**: Unread items impossible to miss
- **Better UX**: Reduced cognitive load and faster navigation
- **Professional Feel**: Modern, polished interface
- **Improved Productivity**: Less time searching, more time working
- **Higher Satisfaction**: Familiar patterns = happy users

**Files Modified**:
- `MainLayout.tsx` (~50 lines) - Navigation structure
- `RequestsListPage.tsx` (~100 lines) - List page enhancements
- `EMAIL_INBOX_REDESIGN.md` (NEW) - Complete documentation
- `EMAIL_INBOX_SUMMARY.md` (NEW) - User-friendly overview
- `EMAIL_INBOX_VISUAL_GUIDE.md` (NEW) - Visual before/after comparisons

**Backward Compatibility**:
✅ Old URLs still work
✅ No database changes
✅ Existing features preserved
✅ Progressive enhancement only

**Testing**:
- ✅ All navigation items work correctly
- ✅ Badge counts display properly
- ✅ Unread highlighting prominent and clear
- ✅ Click-to-mark-as-read functions
- ✅ localStorage persistence works
- ✅ Page titles update correctly
- ✅ Unread counter accurate
- ✅ Info alerts display when needed
- ✅ Empty states show appropriate messages
- ✅ Mobile responsive on all devices
- ✅ All user roles tested

**Documentation**:
- Complete technical spec: `EMAIL_INBOX_REDESIGN.md`
- User guide: `EMAIL_INBOX_SUMMARY.md`
- Visual comparison: `EMAIL_INBOX_VISUAL_GUIDE.md`

---

## Date
Updated: October 19, 2025
