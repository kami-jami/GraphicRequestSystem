# Email-Like Inbox Redesign

## Overview
Redesigning the request list pages to follow an email client UX pattern with Inbox, Outbox, and Completed sections.

## User Experience Goals
- **Intuitive Navigation**: Users should immediately understand where to find new requests, sent requests, and completed work
- **Visual Clarity**: Unread requests should stand out clearly (bold text, background color, indicator)
- **Consistent Sorting**: Newest items first, with unread items prioritized
- **Role-Based Views**: Each role gets appropriate inbox categories

## Design Principles
Following popular email clients like Gmail, Outlook:
- Clean, minimal interface
- Clear visual hierarchy
- Unread indicators (bold text + background color)
- Newest first sorting
- Quick actions accessible
- Count badges on navigation

## Navigation Structure

### For Requester Role:
1. **📥 Inbox (صندوق ورودی)**
   - New responses from designers/approvers
   - Status updates requiring attention
   - Includes: Under Review + Needs Revision statuses
   - Badge count: Unread items in inbox

2. **📤 Outbox (ارسال شده)**
   - Requests sent by the user
   - Active requests in progress
   - All non-completed requests they've created
   
3. **✅ Completed (تکمیل شده)**
   - Finalized and delivered requests
   - Archive of finished work
   - Status: Completed (6)

### For Designer Role:
1. **📥 Inbox (صندوق ورودی)**
   - New assignments
   - Requests needing action
   - Returned from approval
   - Statuses: 1 (Assigned), 5 (Returned from Approval)
   - Badge count: Unread items

2. **📤 Outbox (در حال انجام)**
   - Actively working on
   - Sent for approval
   - Statuses: 3 (In Progress), 4 (Pending Approval)
   
3. **✅ Completed (تکمیل شده)**
   - Delivered projects
   - Status: 6 (Completed)

### For Approver Role:
1. **📥 Inbox (صندوق ورودی)**
   - Requests pending approval
   - Status: 4 (Pending Approval)
   - Badge count: Unread items

2. **📤 Outbox (بررسی شده)**
   - Requests I've reviewed (approved or returned)
   - Statuses: 3, 5, 6
   
3. **✅ Completed (تایید شده)**
   - Approved and completed
   - Status: 6 (Completed)

## Visual Design

### Unread Request Indicators:
- **Background**: Light blue tint (#EBF5FB)
- **Border Left**: 4px solid primary color
- **Font Weight**: Bold for title
- **Icon**: 🔵 Blue dot indicator
- **Badge**: "جدید" chip in top-right corner

### Read Request Appearance:
- **Background**: White/default
- **Border**: None
- **Font Weight**: Normal
- **No indicators**

### List Item Structure:
```
[Unread Indicator] [Request Icon] [Title - Bold if unread] [Status Chip] [Priority] [جدید Badge]
                                  [Type · Due Date · Requester]
```

### Sorting:
1. Unread first (bold, highlighted)
2. Then by date (newest first)
3. Within each group, sort by priority (urgent first)

## Technical Implementation

### Frontend Changes:

1. **Update MainLayout Navigation**:
   - Replace current inbox items with Inbox/Outbox/Completed structure
   - Update icons (InboxIcon, SendIcon, CheckCircleIcon)
   - Add new route parameters

2. **Update RequestsListPage**:
   - Add inbox type parameter (inbox/outbox/completed)
   - Update filtering logic based on inbox type
   - Enhance unread visual styling (bolder, more prominent)
   - Update empty states for each inbox type
   - Add email-like compact view option

3. **Update localStorage Tracking**:
   - Already implemented per-request view tracking
   - Enhance to show stronger visual distinction

### Backend Changes (Minimal):

1. **RequestsController**:
   - Add optional `inboxType` parameter
   - Filter requests based on inbox type + role
   - Keep existing `inboxCategory` for unread tracking

### API Endpoints:
- `GET /api/Requests?inboxType=inbox` - Incoming requests
- `GET /api/Requests?inboxType=outbox` - Sent/active requests  
- `GET /api/Requests?inboxType=completed` - Finished requests

## Implementation Steps:

### Phase 1: Update Navigation (MainLayout.tsx)
✅ Restructure inbox items for each role
✅ Add inbox type to URLs
✅ Update count badges

### Phase 2: Update Request List Page
✅ Add inbox type filtering
✅ Enhance unread styling
✅ Add email-like layout option
✅ Update empty states

### Phase 3: Backend Support
✅ Add inbox type filtering logic
✅ Test with all roles

### Phase 4: Polish & Testing
✅ Test all roles
✅ Verify unread tracking works
✅ Check sorting is correct
✅ Mobile responsive check

## Expected Benefits:
- **Faster Navigation**: Users find what they need instantly
- **Clear Status**: Always know what's new vs. what's been seen
- **Reduced Cognitive Load**: Familiar email metaphor
- **Better Organization**: Logical grouping of requests
- **Improved Productivity**: Quick access to actionable items

## Migration Notes:
- Existing URLs with status filters still work
- Backward compatible with current system
- Progressive enhancement approach
- No database changes required

## Implementation Summary

### ✅ Completed Changes:

#### 1. **Navigation Structure (MainLayout.tsx)**
- **Updated Icons**: Added `SendIcon`, `TaskAltIcon`, `AllInboxIcon`
- **New InboxItem Interface**: Added `inboxType` property
- **Email-like Categories**:
  - 📥 Inbox (صندوق ورودی) - Incoming/new requests
  - 📤 Outbox (ارسال شده/در حال انجام/بررسی شده) - Sent/active requests
  - ✅ Completed (تکمیل شده/تایید شده) - Finalized requests
  - همه - All requests
- **URL Structure**: Now includes `inboxType` parameter
- **Example URLs**:
  - `/requests?inboxType=inbox&statuses=0&statuses=1`
  - `/requests?inboxType=outbox&statuses=3&statuses=4`
  - `/requests?inboxType=completed&statuses=6`

#### 2. **Request List Page (RequestsListPage.tsx)**
- **Added inboxType State**: Tracks current inbox view
- **Enhanced Page Titles**: Dynamic titles based on inbox type with emoji icons
- **Unread Counter**: Shows count in page subtitle: "12 درخواست (3 خوانده نشده)"
- **Info Alert**: Displays when unread items exist in inbox
- **Contextual Empty States**:
  - Inbox: "📥 صندوق ورودی خالی است"
  - Outbox: "📤 هیچ درخواست ارسالی ندارید" (with "Create New" button)
  - Completed: "✅ هیچ درخواست تکمیل شده‌ای ندارید"
- **Enhanced Unread Styling**:
  - Bolder text for unread items (fontWeight 700 vs 600)
  - Blue background tint
  - Left border accent (4px solid)
  - "جدید" badge
  - Blue dot indicator

#### 3. **Visual Enhancements**
- **RequestTableRow Component**:
  - Unread requests have `bgcolor: alpha(theme.palette.info.main, 0.08)`
  - Border right: `3px solid ${theme.palette.info.main}`
  - Bold title text (fontWeight 700)
  - "جدید" chip badge
  - Hover effects enhanced
  
- **RequestListItem Component** (Mobile):
  - Border: `1px solid info.main` for unread
  - Background tint
  - 4px right border accent
  - Bold title (fontWeight 800)
  - "جدید" badge
  - Enhanced shadow on hover

#### 4. **Role-Based Inbox Configuration**

**Requester Role**:
```typescript
{
  inbox: [0, 1, 2],     // Under Review + Needs Revision
  outbox: [0,1,2,3,4,5], // All non-completed
  completed: [6]         // Completed only
}
```

**Designer Role**:
```typescript
{
  inbox: [1, 5],        // Assigned + Returned from Approval
  outbox: [3, 4],       // In Progress + Pending Approval
  completed: [6]        // Completed
}
```

**Approver Role**:
```typescript
{
  inbox: [4],           // Pending Approval
  outbox: [3, 5, 6],    // Reviewed items
  completed: [6]        // Approved/Completed
}
```

## How It Works

### User Flow:

1. **User navigates to "📥 صندوق ورودی"**
   - URL: `/requests?inboxType=inbox&statuses=...`
   - Page shows only incoming/new requests for their role
   - Unread items highlighted in blue with "جدید" badge
   - Info alert shows: "شما 5 درخواست خوانده نشده دارید"

2. **User clicks on a request**
   - `handleRequestClick()` called
   - Request ID added to localStorage Set
   - User navigated to request details
   - On return, request appears without highlighting (marked as read)

3. **User switches to "📤 ارسال شده"**
   - URL: `/requests?inboxType=outbox&statuses=...`
   - Shows sent/active requests
   - Read/unread distinction still applies

4. **User switches to "✅ تکمیل شده"**
   - URL: `/requests?inboxType=completed&statuses=6`
   - Shows only completed requests
   - Archive view of finished work

### Technical Details:

**localStorage Structure**:
```json
{
  "viewedRequests": [123, 456, 789, ...]
}
```

**Unread Calculation**:
```typescript
const isUnread = request.isUnread && !viewedRequests.has(request.id)
```
- Backend provides `isUnread` based on inbox LastViewedAt
- Frontend tracks per-request views in localStorage
- Combined logic: unread if BOTH conditions true

**Sorting Priority**:
1. Unread items first (always at top)
2. Then by selected sort (date/priority/status)
3. Within each group, secondary sort

## Testing Checklist

- ✅ Navigation items show correct icons and labels
- ✅ Badge counts display on inbox items
- ✅ Clicking inbox category loads correct requests
- ✅ Unread requests appear with blue highlighting
- ✅ "جدید" badge shows on unread items
- ✅ Clicking request marks it as read
- ✅ Read requests lose highlighting
- ✅ Page title updates based on inbox type
- ✅ Subtitle shows unread count
- ✅ Info alert appears when unread items exist
- ✅ Empty states show contextual messages
- ✅ Mobile view works correctly
- ✅ localStorage persists across sessions
- ✅ All roles see appropriate inbox categories

## User Benefits

✨ **Intuitive Navigation**: Familiar email-like structure
📬 **Clear Organization**: Inbox/Outbox/Completed makes sense immediately
👀 **Visual Clarity**: Unread items stand out clearly
⚡ **Faster Workflow**: Find what needs attention instantly
🎯 **Reduced Confusion**: No more "where is that request?"
💾 **Persistent Tracking**: Viewed state survives page refreshes
📱 **Mobile Friendly**: Works great on all screen sizes
🔄 **Real-time**: Combines with SignalR for live updates

## Future Enhancements (Optional)

- [ ] Add "Mark all as read" button
- [ ] Add bulk actions (select multiple requests)
- [ ] Add compact/comfortable view density toggle
- [ ] Add keyboard shortcuts (j/k navigation like Gmail)
- [ ] Add preview pane option (3-column layout)
- [ ] Add filters within inbox types
- [ ] Add search within current inbox
- [ ] Add "Starred" or "Important" flag
- [ ] Export to CSV/Excel functionality

## Conclusion

The email-like inbox redesign successfully transforms the request management system into an intuitive, familiar interface that users understand immediately. The combination of visual cues, smart organization, and persistent tracking creates a professional, modern experience that significantly improves productivity and user satisfaction.
