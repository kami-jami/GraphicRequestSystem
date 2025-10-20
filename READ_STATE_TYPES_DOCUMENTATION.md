# Read State Types Documentation

## Overview

The system implements two distinct types of read states to manage how users interact with requests:

| State | Type | Purpose | Implementation |
|-------|------|---------|----------------|
| **ActionRequired** | Unread indicator | User must take action on the request | `IsUnread = true` (shows visual indicators) |
| **InfoOnly** | Notification only | User needs awareness but no action | `IsUnread = false` (no unread indicator, notification only) |

## How It Works

### ActionRequired (Unread = true)

**Condition:** User is the **responsible party** at current status AND (never viewed OR status changed since last view)

**Visual Indicators:**
- Blue background in list
- Blue border on right
- "جدید" (New) badge
- Bold text
- Unread count in inbox badge

**When Applied:**
- Admin when request is newly submitted (Status 0)
- Designer when assigned or needs to redesign (Status 1, 5)
- Requester when corrections needed (Status 2)
- Designer when work in progress (Status 3)
- Approver when approval needed (Status 4)

### InfoOnly (Unread = false)

**Condition:** User can **see** the request but is NOT responsible for action at current status

**Visual Indicators:**
- Normal background
- No special border
- No "New" badge
- Normal text weight
- No unread count contribution

**Notifications:**
- User still receives notifications
- Notifications inform of changes
- No inbox clutter from info-only updates

## Status-Based Responsibility Matrix

| Status | Responsible User (ActionRequired) | Other Users (InfoOnly) |
|--------|-----------------------------------|------------------------|
| **0: Submitted** | Admin | Requester (submitted, waiting) |
| **1: DesignerReview** | Assigned Designer | Admin, Requester |
| **2: PendingCorrection** | Requester | Designer, Admin |
| **3: DesignInProgress** | Designer | Requester, Admin |
| **4: PendingApproval** | Approver | Designer, Requester, Admin |
| **5: PendingRedesign** | Designer | Approver, Requester, Admin |
| **6: Completed** | None (all InfoOnly) | All users |

## Real-World Examples

### Example 1: Designer Completes Work

**Event:** Designer marks design as complete → Status changes to PendingApproval (4)

**User States:**

| User | State Type | IsUnread | Visual | Reason |
|------|-----------|----------|--------|--------|
| Approver | **ActionRequired** | `true` | Blue background, badge | Must approve/reject |
| Designer | **InfoOnly** | `false` | Normal | Already completed, just waiting |
| Requester | **InfoOnly** | `false` | Normal | Just monitoring progress |
| Admin | **InfoOnly** | `false` | Normal | Just monitoring |

**What Happens:**
- ✅ Approver sees unread indicator (needs to act)
- ✅ Approver gets notification
- ✅ Others get notifications but no unread indicator
- ✅ Others' inboxes stay clean

### Example 2: Approver Requests Redesign

**Event:** Approver rejects design → Status changes to PendingRedesign (5)

**User States:**

| User | State Type | IsUnread | Visual | Reason |
|------|-----------|----------|--------|--------|
| Designer | **ActionRequired** | `true` | Blue background, badge | Must redesign |
| Approver | **InfoOnly** | `false` | Normal | Already reviewed, waiting |
| Requester | **InfoOnly** | `false` | Normal | Just monitoring |
| Admin | **InfoOnly** | `false` | Normal | Just monitoring |

**What Happens:**
- ✅ Designer sees unread indicator (needs to redesign)
- ✅ Designer gets notification about rejection
- ✅ Others get notifications but no unread indicator

### Example 3: Request Submitted

**Event:** Requester submits new request → Status = Submitted (0)

**User States:**

| User | State Type | IsUnread | Visual | Reason |
|------|-----------|----------|--------|--------|
| Admin | **ActionRequired** | `true` | Blue background, badge | Must assign designer |
| Requester | **InfoOnly** | `false` | Normal | Already submitted, waiting |

**What Happens:**
- ✅ Admin sees unread indicator (needs to assign)
- ✅ Requester sees their submission with normal styling
- ✅ Requester can track progress without it showing as "unread"

### Example 4: Request Completed

**Event:** Approver approves → Status = Completed (6)

**User States:**

| User | State Type | IsUnread | Visual | Reason |
|------|-----------|----------|--------|--------|
| Designer | **InfoOnly** | `false` | Normal | No action needed |
| Approver | **InfoOnly** | `false` | Normal | Already approved |
| Requester | **InfoOnly** | `false` | Normal | Received, no action |
| Admin | **InfoOnly** | `false` | Normal | Just monitoring |

**What Happens:**
- ✅ All users see completed request with normal styling
- ✅ All users get completion notifications
- ✅ No one has unread indicators (work is done)

## Implementation Details

### Backend Logic

The `IsResponsibleUser` helper method determines responsibility:

```csharp
private static bool IsResponsibleUser(
    string currentUserId,
    string? requesterId,
    string? designerId,
    string? approverId,
    Core.Enums.RequestStatus status,
    IList<string> userRoles)
{
    return status switch
    {
        // ActionRequired conditions per status
        RequestStatus.Submitted => userRoles.Contains("Admin"),
        RequestStatus.DesignerReview => currentUserId == designerId,
        RequestStatus.PendingCorrection => currentUserId == requesterId,
        RequestStatus.DesignInProgress => currentUserId == designerId,
        RequestStatus.PendingApproval => currentUserId == approverId,
        RequestStatus.PendingRedesign => currentUserId == designerId,
        RequestStatus.Completed => false, // No action needed
        _ => false
    };
}
```

### IsUnread Calculation

```csharp
IsUnread = IsResponsibleUser(userId, r.RequesterId, r.DesignerId, r.ApproverId, r.Status, userRoles) &&
          (!viewedRequestStatusMap.TryGetValue((r.Id, r.Status), out var lastViewedAt) ||
          (r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt)
```

**Breakdown:**
1. `IsResponsibleUser(...)` → Checks if user needs to take action (ActionRequired)
2. `!viewedRequestStatusMap.TryGetValue(...)` → User hasn't viewed at this status
3. `(r.LatestHistoryDate ?? r.SubmissionDate) > lastViewedAt` → Status changed since last view

**Result:**
- If `IsResponsibleUser = false` → Always InfoOnly (no unread indicator)
- If `IsResponsibleUser = true` AND (not viewed OR changed) → ActionRequired (unread indicator)

### Notification System

**Separate from Unread Logic:**
- Notifications are sent to ALL stakeholders via `NotificationService`
- Notifications inform about status changes, assignments, completions
- Notifications appear in notification dropdown
- Notifications don't affect unread indicators

**Example:**
```csharp
// Designer completes work
await _notificationService.CreateNotificationAsync(
    request.ApproverId,  // ActionRequired user
    id,
    $"درخواست جدیدی منتظر تایید شماست: {request.Title}",
    "PendingApproval"
);

// Also notify designer (InfoOnly user)
await _notificationService.SendInboxUpdateAsync(
    request.ApproverId, 
    request.DesignerId  // InfoOnly - gets notification but no unread
);
```

## Benefits of This Approach

### 1. Clear Action Items
✅ **ActionRequired** = "You need to do something"
✅ **InfoOnly** = "FYI, no action needed from you"

### 2. Clean Inboxes
✅ Users only see unread for items requiring their action
✅ No clutter from informational updates
✅ Easy to prioritize work

### 3. Better Workflow
✅ Designer completes → Approver sees unread
✅ Designer doesn't see their completed work as unread again
✅ Requester monitors without false unread indicators

### 4. Notification Clarity
✅ Everyone stays informed via notifications
✅ Unread indicator separate from notification system
✅ No confusion between "informed" and "must act"

## User Experience Scenarios

### Scenario 1: Designer's Perspective

**During Design Phase (Status 3):**
- **ActionRequired**: Request shows as unread (must complete)
- Visual: Blue background, badge, bold text
- Action: Complete design or send for approval

**After Sending for Approval (Status 4):**
- **InfoOnly**: Request shows as read (no action needed)
- Visual: Normal styling
- Notification: "Request sent for approval"
- Can still view request details anytime

**If Approver Rejects (Status 5):**
- **ActionRequired**: Request becomes unread again (must redesign)
- Visual: Blue background returns
- Notification: "Request needs redesign"
- Action: Redesign and resubmit

### Scenario 2: Approver's Perspective

**Before Designer Completes (Status 3):**
- **InfoOnly**: Can see request but shows as read
- Visual: Normal styling
- Knows work is in progress, no action needed

**After Designer Completes (Status 4):**
- **ActionRequired**: Request becomes unread (must approve)
- Visual: Blue background, badge
- Notification: "New request awaiting approval"
- Action: Approve or request redesign

**After Approving (Status 6):**
- **InfoOnly**: Request shows as read (completed)
- Visual: Normal styling
- No further action needed

### Scenario 3: Requester's Perspective

**After Submitting (Status 0):**
- **InfoOnly**: Can see their submission but shows as read
- Visual: Normal styling (they submitted it, no action needed)
- Notification: "Request submitted successfully"
- Waits for admin to assign designer

**During Design (Status 1, 3, 4):**
- **InfoOnly**: All intermediate statuses show as read
- Visual: Normal styling throughout
- Notifications: Informed of each stage
- Can monitor progress without clutter

**If Corrections Needed (Status 2):**
- **ActionRequired**: Request becomes unread (must fix)
- Visual: Blue background, badge
- Notification: "Request needs corrections"
- Action: Fix issues and resubmit

**When Completed (Status 6):**
- **InfoOnly**: Shows as read (work done)
- Notification: "Request completed"
- Can review final deliverables

## Summary Table

| Status Change | From → To | Responsible User | State Type | Others |
|--------------|-----------|------------------|------------|--------|
| Submit | - → 0 | Admin | ActionRequired | Requester: InfoOnly |
| Assign | 0 → 1 | Designer | ActionRequired | Admin, Requester: InfoOnly |
| Start | 1 → 3 | Designer | ActionRequired | All others: InfoOnly |
| Complete | 3 → 4 | Approver | ActionRequired | Designer, Requester: InfoOnly |
| Approve | 4 → 6 | None | All InfoOnly | All: InfoOnly |
| Reject | 4 → 5 | Designer | ActionRequired | Approver, Requester: InfoOnly |
| Resubmit | 5 → 4 | Approver | ActionRequired | Designer, Requester: InfoOnly |
| Return | 1 → 2 | Requester | ActionRequired | Designer, Admin: InfoOnly |
| Resubmit | 2 → 1 | Admin | ActionRequired | Requester, Designer: InfoOnly |

## Configuration

**Current Implementation:**
- Hardcoded in `IsResponsibleUser` method
- Based on request status and user assignments
- No configuration required

**Future Enhancements:**
- Configurable responsibility rules
- Custom notification preferences per user
- Optional "watch" mode for stakeholders
- SLA tracking for ActionRequired items

## Testing Checklist

### ActionRequired Tests
- [ ] Admin sees unread for newly submitted requests (Status 0)
- [ ] Designer sees unread when assigned (Status 1)
- [ ] Designer sees unread for redesign requests (Status 5)
- [ ] Requester sees unread for correction requests (Status 2)
- [ ] Approver sees unread for pending approval (Status 4)
- [ ] Unread disappears after user views the request

### InfoOnly Tests
- [ ] Requester doesn't see unread after submitting
- [ ] Designer doesn't see unread after completing work
- [ ] Approver doesn't see unread while designer works
- [ ] All users don't see unread for completed requests
- [ ] Users still receive notifications for InfoOnly updates

### Notification Tests
- [ ] All stakeholders receive notifications regardless of state type
- [ ] Notifications appear in notification dropdown
- [ ] Notifications don't affect unread counts
- [ ] Notification content is informative

## Conclusion

The current implementation successfully separates **ActionRequired** (unread indicators) from **InfoOnly** (notifications only) states. This provides:

1. **Clear Action Items**: Unread = you must act
2. **Clean Inboxes**: No clutter from informational updates
3. **Complete Awareness**: Everyone stays informed via notifications
4. **Better UX**: Users know exactly what needs their attention

The system automatically determines state type based on workflow position, user role, and request status, providing an intuitive and efficient user experience.
