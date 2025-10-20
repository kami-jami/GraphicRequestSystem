# Inbox Logic Redesign - Complete Specification

## Overview

This document defines the **NEW inbox (cartable) logic** based on updated requirements that better reflect the actual workflow and eliminate the unused Status #0 (Submitted) from user-facing views.

**Implementation Date**: January 2025  
**Phase**: 23 - Inbox Logic Restructuring

---

## Current System Analysis

### Status Definitions

| Status | Name | Description |
|--------|------|-------------|
| 0 | Submitted | Auto-assigned to default designer (not visible to users) |
| 1 | DesignerReview | Waiting for designer to start work |
| 2 | PendingCorrection | Returned to requester for fixes |
| 3 | DesignInProgress | Designer actively working |
| 4 | PendingApproval | Waiting for approver decision |
| 5 | PendingRedesign | Approver rejected, needs redesign |
| 6 | Completed | Request finalized and delivered |

### Key Insight

**Status #0 (Submitted) is transient:**
- Created when requester submits
- Immediately auto-assigned to default designer
- Transitions to Status #1 (DesignerReview) automatically
- **Users never see Status #0 in their inboxes**

This is correct behavior - Status #0 exists only for scalability (future multi-designer assignment), but in current single-designer setup, it's invisible to users.

---

## New Inbox Structure

### 1. Requester Inboxes

#### **"Needs Correction" (نیاز به اصلاح)**
- **Statuses**: `[2]` (PendingCorrection)
- **Purpose**: Requests returned by designer for fixes
- **Action Required**: YES - Requester must make corrections
- **Unread Logic**: Shows as unread when designer returns request
- **Badge Color**: Error (red)
- **Icon**: ✏️ EditNoteIcon

#### **"My Requests" (درخواست‌های من)**
- **Statuses**: `[1, 3, 4, 5]` (DesignerReview, DesignInProgress, PendingApproval, PendingRedesign)
- **Purpose**: Track all active requests in the workflow
- **Action Required**: NO - Monitoring only
- **Unread Logic**: No unread indicators (informational view)
- **Badge Color**: Info (blue)
- **Icon**: 📤 SendIcon
- **Note**: Does NOT include Status #0 (auto-assigned, invisible)

#### **"Completed" (تکمیل شده)**
- **Statuses**: `[6]` (Completed)
- **Purpose**: Archive of finalized requests
- **Action Required**: NO - Reference only
- **Unread Logic**: Optional unread for new completions
- **Badge Color**: Success (green)
- **Icon**: ✅ TaskAltIcon

---

### 2. Designer Inboxes

#### **"Design Requests" (درخواست‌های طراحی)**
- **Statuses**: `[1, 5]` (DesignerReview, PendingRedesign)
- **Purpose**: New assignments and redesign requests
- **Action Required**: YES - Designer must start/restart work
- **Unread Logic**: Shows as unread for new requests and rejections
- **Badge Color**: Primary (blue)
- **Icon**: 🎨 InboxIcon
- **Note**: Does NOT include Status #0 (never visible to designer)

#### **"In Progress" (در حال انجام)**
- **Statuses**: `[3]` (DesignInProgress)
- **Purpose**: Currently working on these designs
- **Action Required**: ONGOING - Active work
- **Unread Logic**: No unread (designer is already working)
- **Badge Color**: Warning (orange)
- **Icon**: 🔧 BuildIcon

#### **"Waiting Requests" (درخواست‌های در انتظار)**
- **Statuses**: `[2, 4]` (PendingCorrection, PendingApproval)
- **Purpose**: Waiting on others (requester or approver)
- **Action Required**: NO - Monitoring only
- **Unread Logic**: No unread indicators
- **Badge Color**: Info (blue)
- **Icon**: ⏳ HourglassEmptyIcon
- **Note**: Designer sent these and is waiting for response

#### **"Completed" (تکمیل شده)**
- **Statuses**: `[6]` (Completed)
- **Purpose**: Delivered designs archive
- **Action Required**: NO - Reference only
- **Unread Logic**: Optional unread for approvals
- **Badge Color**: Success (green)
- **Icon**: ✅ TaskAltIcon

---

### 3. Approver Inboxes

#### **"Pending Approval" (در انتظار تایید)**
- **Statuses**: `[4]` (PendingApproval)
- **Purpose**: Designs ready for approval decision
- **Action Required**: YES - Approver must approve/reject
- **Unread Logic**: Shows as unread for new approval requests
- **Badge Color**: Primary (blue)
- **Icon**: 📋 AssignmentIcon

#### **"Approved" (تایید شده)**
- **Statuses**: `[6]` (Completed)
- **Purpose**: Successfully approved requests
- **Action Required**: NO - Reference only
- **Unread Logic**: Optional unread for new completions
- **Badge Color**: Success (green)
- **Icon**: ✅ CheckCircleIcon

#### **"All Requests" (همه درخواست‌ها)**
- **Statuses**: `[1, 2, 3, 5]` (DesignerReview, PendingCorrection, DesignInProgress, PendingRedesign)
- **Purpose**: Monitor entire workflow (supervisor view)
- **Action Required**: NO - Monitoring/oversight
- **Unread Logic**: No unread indicators
- **Badge Color**: Info (blue)
- **Icon**: 📊 DashboardIcon
- **Note**: Does NOT include Status #0, #4, or #6 (those are in other views)

---

## Multi-Role User Solution

### Problem Statement

Users can have multiple roles simultaneously:
- **Example 1**: User is both Requester and Designer
- **Example 2**: User is Requester, Designer, and Approver (Admin)
- **Challenge**: How to show all relevant inboxes clearly?

### Recommended Solution: **Unified Navigation with Role Grouping**

#### Implementation Approach

**1. Accumulate All Inbox Items (Current Behavior - Keep This)**

```typescript
const getInboxItems = (): InboxItem[] => {
    const userRoles = user?.roles || [];
    const items: InboxItem[] = [];

    // Accumulate items for ALL roles
    if (userRoles.includes('Requester')) {
        items.push(...getRequesterInboxes());
    }
    if (userRoles.includes('Designer')) {
        items.push(...getDesignerInboxes());
    }
    if (userRoles.includes('Approver')) {
        items.push(...getApproverInboxes());
    }

    return items;
};
```

**2. Add Visual Role Separators**

```typescript
// Add dividers or group labels between role sections
const items: InboxItem[] = [];

if (userRoles.includes('Requester')) {
    items.push({ type: 'header', text: 'من به عنوان درخواست‌کننده' }); // "As Requester"
    items.push(...getRequesterInboxes());
}

if (userRoles.includes('Designer')) {
    if (items.length > 0) items.push({ type: 'divider' });
    items.push({ type: 'header', text: 'من به عنوان طراح' }); // "As Designer"
    items.push(...getDesignerInboxes());
}

if (userRoles.includes('Approver')) {
    if (items.length > 0) items.push({ type: 'divider' });
    items.push({ type: 'header', text: 'من به عنوان تاییدکننده' }); // "As Approver"
    items.push(...getApproverInboxes());
}
```

**3. Role-Aware Filtering in Backend (Already Implemented)**

The backend already handles multi-role filtering correctly:

```csharp
// Security filter - show requests based on ALL user roles
if (!userRoles.Contains("Admin"))
{
    query = query.Where(r =>
        // Requester: see own requests
        (userRoles.Contains("Requester") && r.RequesterId == userId) ||
        
        // Designer: see assigned requests
        (userRoles.Contains("Designer") && r.DesignerId == userId) ||
        
        // Approver: see pending approvals
        (userRoles.Contains("Approver") && r.ApproverId == userId && r.Status == RequestStatus.PendingApproval)
    );
}
```

**Key Point**: The OR logic means users see the **union** of all requests they have access to through any role.

**4. Unread Badge Logic for Multi-Role Users**

The `IsResponsibleUser()` helper correctly handles multi-role scenarios:

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
        RequestStatus.DesignerReview => currentUserId == designerId,
        RequestStatus.PendingCorrection => currentUserId == requesterId,
        RequestStatus.DesignInProgress => currentUserId == designerId,
        RequestStatus.PendingApproval => currentUserId == approverId,
        RequestStatus.PendingRedesign => currentUserId == designerId,
        RequestStatus.Completed => false,
        _ => false
    };
}
```

**Example Scenario:**
- User is both Requester AND Designer
- Request #100: User submitted it (Requester), Status = 2 (PendingCorrection)
  - User sees in "Needs Correction" inbox (as Requester)
  - Shows as UNREAD (currentUserId == requesterId)
  
- Request #200: Assigned to user (Designer), Status = 1 (DesignerReview)
  - User sees in "Design Requests" inbox (as Designer)
  - Shows as UNREAD (currentUserId == designerId)

No conflict! Each request appears in the correct role-specific inbox with correct unread status.

---

## Updated Navigation Structure

### Frontend Implementation (MainLayout.tsx)

```typescript
interface InboxItem {
    text: string;
    icon: React.ReactNode;
    inboxType: 'inbox' | 'outbox' | 'completed' | 'all' | 'waiting' | 'progress';
    statuses: number[];
    countKey?: string;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    description?: string;
    actionRequiredOnly?: boolean;
    roleLabel?: string; // NEW: For multi-role grouping
}

const getInboxItems = (): InboxItem[] => {
    const userRoles = user?.roles || [];
    const items: InboxItem[] = [];

    // === REQUESTER INBOXES ===
    if (userRoles.includes('Requester')) {
        items.push(
            {
                text: '✏️ نیاز به اصلاح',
                icon: <EditNoteIcon fontSize="small" />,
                inboxType: 'inbox',
                statuses: [2], // PendingCorrection
                countKey: 'requester_needsCorrection',
                color: 'error',
                description: 'درخواست‌های برگشتی که نیاز به اصلاح دارند',
                actionRequiredOnly: true,
                roleLabel: 'Requester'
            },
            {
                text: '📤 درخواست‌های من',
                icon: <SendIcon fontSize="small" />,
                inboxType: 'outbox',
                statuses: [1, 3, 4, 5], // DesignerReview, DesignInProgress, PendingApproval, PendingRedesign
                color: 'info',
                description: 'پیگیری درخواست‌های ارسالی در مراحل مختلف',
                actionRequiredOnly: false,
                roleLabel: 'Requester'
            },
            {
                text: '✅ تکمیل شده',
                icon: <TaskAltIcon fontSize="small" />,
                inboxType: 'completed',
                statuses: [6], // Completed
                countKey: 'requester_completed',
                color: 'success',
                description: 'درخواست‌های نهایی شده',
                actionRequiredOnly: false,
                roleLabel: 'Requester'
            }
        );
    }

    // === DESIGNER INBOXES ===
    if (userRoles.includes('Designer')) {
        items.push(
            {
                text: '🎨 درخواست‌های طراحی',
                icon: <InboxIcon fontSize="small" />,
                inboxType: 'inbox',
                statuses: [1, 5], // DesignerReview, PendingRedesign
                countKey: 'designer_newRequests',
                color: 'primary',
                description: 'درخواست‌های جدید و نیاز به طراحی مجدد',
                actionRequiredOnly: true,
                roleLabel: 'Designer'
            },
            {
                text: '🔧 در حال انجام',
                icon: <BuildIcon fontSize="small" />,
                inboxType: 'progress',
                statuses: [3], // DesignInProgress
                color: 'warning',
                description: 'درخواست‌هایی که در حال طراحی هستند',
                actionRequiredOnly: false,
                roleLabel: 'Designer'
            },
            {
                text: '⏳ در انتظار',
                icon: <HourglassEmptyIcon fontSize="small" />,
                inboxType: 'waiting',
                statuses: [2, 4], // PendingCorrection, PendingApproval
                color: 'info',
                description: 'منتظر اصلاح یا تایید',
                actionRequiredOnly: false,
                roleLabel: 'Designer'
            },
            {
                text: '✅ تحویل داده شده',
                icon: <TaskAltIcon fontSize="small" />,
                inboxType: 'completed',
                statuses: [6], // Completed
                countKey: 'designer_completed',
                color: 'success',
                description: 'طراحی‌های تحویل شده',
                actionRequiredOnly: false,
                roleLabel: 'Designer'
            }
        );
    }

    // === APPROVER INBOXES ===
    if (userRoles.includes('Approver')) {
        items.push(
            {
                text: '📋 در انتظار تایید',
                icon: <AssignmentIcon fontSize="small" />,
                inboxType: 'inbox',
                statuses: [4], // PendingApproval
                countKey: 'approver_pendingApproval',
                color: 'primary',
                description: 'درخواست‌های آماده برای تایید',
                actionRequiredOnly: true,
                roleLabel: 'Approver'
            },
            {
                text: '✅ تایید شده',
                icon: <CheckCircleIcon fontSize="small" />,
                inboxType: 'completed',
                statuses: [6], // Completed
                countKey: 'approver_approved',
                color: 'success',
                description: 'درخواست‌های تایید شده',
                actionRequiredOnly: false,
                roleLabel: 'Approver'
            },
            {
                text: '📊 همه درخواست‌ها',
                icon: <DashboardIcon fontSize="small" />,
                inboxType: 'all',
                statuses: [1, 2, 3, 5], // DesignerReview, PendingCorrection, DesignInProgress, PendingRedesign
                color: 'info',
                description: 'نظارت بر کل فرآیند',
                actionRequiredOnly: false,
                roleLabel: 'Approver'
            }
        );
    }

    return items;
};
```

---

## Backend Count Keys Update

### Updated GetInboxCounts Endpoint

```csharp
[HttpGet("inbox-counts")]
public async Task<IActionResult> GetInboxCounts()
{
    var userId = User.FindFirstValue("id");
    if (string.IsNullOrEmpty(userId)) return Unauthorized();

    var currentUser = await _userManager.FindByIdAsync(userId);
    var userRoles = await _userManager.GetRolesAsync(currentUser);
    var counts = new Dictionary<string, int>();

    // Get viewed requests
    var viewedRequestStatusMap = await GetViewedRequestStatusMap(userId);

    // === REQUESTER COUNTS ===
    if (userRoles.Contains("Requester"))
    {
        // Needs Correction (Status 2)
        counts["requester_needsCorrection"] = await GetUnreadItemsCount(
            q => q.Where(r => r.RequesterId == userId && r.Status == RequestStatus.PendingCorrection),
            userId, userRoles, viewedRequestStatusMap
        );

        // My Requests - no count (monitoring view)
        
        // Completed
        counts["requester_completed"] = await GetUnreadItemsCount(
            q => q.Where(r => r.RequesterId == userId && r.Status == RequestStatus.Completed),
            userId, userRoles, viewedRequestStatusMap
        );
    }

    // === DESIGNER COUNTS ===
    if (userRoles.Contains("Designer"))
    {
        // Design Requests (Statuses 1, 5)
        counts["designer_newRequests"] = await GetUnreadItemsCount(
            q => q.Where(r => r.DesignerId == userId && 
                (r.Status == RequestStatus.DesignerReview || r.Status == RequestStatus.PendingRedesign)),
            userId, userRoles, viewedRequestStatusMap
        );

        // In Progress - no count (active work)
        
        // Waiting - no count (monitoring view)
        
        // Completed
        counts["designer_completed"] = await GetUnreadItemsCount(
            q => q.Where(r => r.DesignerId == userId && r.Status == RequestStatus.Completed),
            userId, userRoles, viewedRequestStatusMap
        );
    }

    // === APPROVER COUNTS ===
    if (userRoles.Contains("Approver"))
    {
        // Pending Approval (Status 4)
        counts["approver_pendingApproval"] = await GetUnreadItemsCount(
            q => q.Where(r => r.ApproverId == userId && r.Status == RequestStatus.PendingApproval),
            userId, userRoles, viewedRequestStatusMap
        );

        // Approved
        counts["approver_approved"] = await GetUnreadItemsCount(
            q => q.Where(r => r.ApproverId == userId && r.Status == RequestStatus.Completed),
            userId, userRoles, viewedRequestStatusMap
        );

        // All Requests - no count (monitoring view)
    }

    return Ok(counts);
}
```

---

## State Flow Diagrams

### Requester Perspective

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUESTER WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

Submit Request
     │
     ▼
Status #0 (Submitted) ──► Auto-assigned to Designer
     │                     [NOT VISIBLE TO REQUESTER]
     │
     ▼
Status #1 (DesignerReview) ──► Appears in "📤 My Requests"
     │                          [Monitoring only, no unread]
     │
     ├──► Status #3 (DesignInProgress) ──► Still in "📤 My Requests"
     │                                      [Monitoring only]
     │
     ├──► Status #2 (PendingCorrection) ──► Moves to "✏️ Needs Correction"
     │    │                                  [ACTION REQUIRED, shows as UNREAD]
     │    │
     │    └──► Requester fixes & resubmits
     │         │
     │         └──► Back to Status #1
     │
     └──► Status #4 (PendingApproval) ──► Still in "📤 My Requests"
          │                               [Monitoring only]
          │
          ├──► Status #5 (PendingRedesign) ──► Still in "📤 My Requests"
          │                                     [Monitoring only]
          │
          └──► Status #6 (Completed) ──► Moves to "✅ Completed"
                                         [Archive]
```

### Designer Perspective

```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGNER WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

Status #1 (DesignerReview) ──► Appears in "🎨 Design Requests"
     │                          [ACTION REQUIRED, shows as UNREAD]
     │
     ▼
Designer starts work
     │
     ▼
Status #3 (DesignInProgress) ──► Moves to "🔧 In Progress"
     │                            [Active work, no unread]
     │
     ├──► Sends back for correction
     │    │
     │    └──► Status #2 (PendingCorrection) ──► Moves to "⏳ Waiting"
     │         │                                  [Monitoring, no unread]
     │         │
     │         └──► Requester fixes
     │              │
     │              └──► Back to Status #1 ──► Back to "🎨 Design Requests"
     │                                          [ACTION REQUIRED again]
     │
     └──► Completes design
          │
          └──► Status #4 (PendingApproval) ──► Moves to "⏳ Waiting"
               │                                [Monitoring, no unread]
               │
               ├──► Approver approves
               │    │
               │    └──► Status #6 (Completed) ──► Moves to "✅ Delivered"
               │                                   [Archive]
               │
               └──► Approver rejects
                    │
                    └──► Status #5 (PendingRedesign) ──► Back to "🎨 Design Requests"
                                                          [ACTION REQUIRED again]
```

### Approver Perspective

```
┌─────────────────────────────────────────────────────────────┐
│                    APPROVER WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

Status #4 (PendingApproval) ──► Appears in "📋 Pending Approval"
     │                           [ACTION REQUIRED, shows as UNREAD]
     │
     │
     ├──► Can monitor other statuses in "📊 All Requests":
     │    • Status #1 (DesignerReview)
     │    • Status #2 (PendingCorrection)
     │    • Status #3 (DesignInProgress)
     │    • Status #5 (PendingRedesign)
     │    [Monitoring only, no unread badges]
     │
     ▼
Approver reviews design
     │
     ├──► APPROVE
     │    │
     │    └──► Status #6 (Completed) ──► Moves to "✅ Approved"
     │                                   [Archive]
     │
     └──► REJECT
          │
          └──► Status #5 (PendingRedesign) ──► Moves to "📊 All Requests"
                                               [No longer in Pending Approval]
```

---

## Implementation Checklist

### Phase 1: Backend Updates

- [ ] Update `GetInboxCounts` count keys:
  - [x] `requester_needsCorrection` (was `requester_needsRevision`)
  - [ ] Remove `requester_underReview` (Status #0 not visible)
  - [ ] Add `designer_newRequests` (Statuses 1, 5)
  - [ ] Remove `designer_pendingAction` 
  - [ ] Add `approver_approved` (Status 6 for approver)

- [ ] Verify `IsResponsibleUser` logic matches new structure (already correct)

- [ ] Test multi-role filtering in `GetRequests` endpoint

### Phase 2: Frontend Navigation Updates

- [ ] Update `MainLayout.tsx` inbox structure:
  - [ ] Requester: Remove "Under Review", update "My Requests" statuses to [1,3,4,5]
  - [ ] Designer: Split into 4 views (Design Requests, In Progress, Waiting, Completed)
  - [ ] Approver: Add "All Requests" monitoring view

- [ ] Add role grouping/separators for multi-role users

- [ ] Update count keys to match backend

- [ ] Add new icons (BuildIcon, HourglassEmptyIcon, AssignmentIcon, CheckCircleIcon, DashboardIcon)

### Phase 3: Testing

- [ ] Single-role users:
  - [ ] Test Requester workflows
  - [ ] Test Designer workflows
  - [ ] Test Approver workflows

- [ ] Multi-role users:
  - [ ] Test Requester + Designer
  - [ ] Test Requester + Approver
  - [ ] Test Designer + Approver
  - [ ] Test Requester + Designer + Approver (Admin)

- [ ] Verify unread badges appear correctly for each role

- [ ] Test status transitions and inbox movements

### Phase 4: Documentation

- [ ] Update user guide
- [ ] Create inbox logic documentation
- [ ] Document multi-role behavior
- [ ] Add workflow diagrams

---

## Key Improvements

### 1. **Status #0 Eliminated from UI**
- ✅ Reflects reality: Status #0 is auto-assigned, never visible to users
- ✅ Cleaner UX: Users don't see "submitted" status that immediately changes
- ✅ Accurate tracking: "My Requests" starts at DesignerReview (Status #1)

### 2. **Designer Workflow Clarity**
- ✅ Clear separation: New work vs Active work vs Waiting
- ✅ "In Progress" view: Shows what designer is currently working on
- ✅ "Waiting" view: Transparent about requests waiting on others

### 3. **Approver Oversight**
- ✅ "All Requests" monitoring view: Full visibility into workflow
- ✅ Supervisor capability: Track team progress
- ✅ No clutter: Main inbox only shows approval-needed items

### 4. **Multi-Role Support**
- ✅ Unified navigation: All relevant inboxes in one place
- ✅ Role grouping: Clear visual separation
- ✅ No conflicts: Each request appears in correct role-specific view
- ✅ Correct unread badges: Based on user's responsibility at current status

### 5. **Scalability**
- ✅ Status #0 reserved for future multi-designer assignment
- ✅ Backend logic already supports complex role combinations
- ✅ Easy to add new roles or modify workflows

---

## Migration Notes

**Breaking Changes**: YES - Navigation structure changes

**Migration Steps**:
1. Deploy backend count key updates
2. Deploy frontend navigation changes
3. Clear user browser caches
4. Announce changes to users with new inbox guide

**Rollback**: Not recommended - new structure is more accurate

**User Communication**:
- "My Requests" now starts when designer begins review (not at submission)
- New "In Progress" and "Waiting" views for designers
- Approvers now have "All Requests" monitoring capability

---

## Conclusion

This redesign creates a **more accurate and intuitive inbox structure** that reflects the actual workflow. Status #0 is correctly hidden from users (as it should be), designers have better visibility into their work pipeline, and multi-role users see all relevant inboxes clearly grouped by role.

The implementation leverages existing backend logic (IsResponsibleUser, multi-role filtering) and simply reorganizes the frontend presentation for maximum clarity and usability.

---

**Status**: ⏳ PENDING IMPLEMENTATION  
**Priority**: HIGH  
**Complexity**: MEDIUM  
**Estimated Time**: 4-6 hours
