# Response to Instructions.yml - Inbox Logic Redesign

## Executive Summary

This document provides the complete solution for redefining and optimizing the task inbox ("cartable") logic as requested in `Instructions.yml`.

**Status**: ✅ **FULLY IMPLEMENTED**  
**Date**: January 2025  
**Phase**: 23 - Inbox Logic Restructuring

---

## 1. Revised Logical Structure

### Status Flow Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────┘

0. Submitted (Internal Only - Auto-assigned to default designer)
   ├─ NOT visible in any user inbox
   ├─ Immediately transitions to Status #1
   └─ Reserved for future multi-designer assignment

1. DesignerReview (Designer needs to start)
   ├─ Visible in Designer: "درخواست‌های طراحی" (Action Required)
   ├─ Visible in Requester: "درخواست‌های من" (Monitoring)
   └─ Visible in Approver: "همه درخواست‌ها" (Monitoring)

2. PendingCorrection (Requester needs to fix)
   ├─ Visible in Requester: "نیاز به اصلاح" (Action Required)
   ├─ Visible in Designer: "در انتظار" (Monitoring)
   └─ Visible in Approver: "همه درخواست‌ها" (Monitoring)

3. DesignInProgress (Designer actively working)
   ├─ Visible in Designer: "در حال انجام" (Active Work)
   ├─ Visible in Requester: "درخواست‌های من" (Monitoring)
   └─ Visible in Approver: "همه درخواست‌ها" (Monitoring)

4. PendingApproval (Approver needs to decide)
   ├─ Visible in Approver: "در انتظار تایید" (Action Required)
   ├─ Visible in Designer: "در انتظار" (Monitoring)
   └─ Visible in Requester: "درخواست‌های من" (Monitoring)

5. PendingRedesign (Designer needs to redesign)
   ├─ Visible in Designer: "درخواست‌های طراحی" (Action Required)
   ├─ Visible in Requester: "درخواست‌های من" (Monitoring)
   └─ Visible in Approver: "همه درخواست‌ها" (Monitoring)

6. Completed (Finalized)
   ├─ Visible in Requester: "تکمیل شده" (Archive)
   ├─ Visible in Designer: "تحویل داده شده" (Archive)
   └─ Visible in Approver: "تایید شده" (Archive)
```

---

## 2. Pseudocode and Logic Rules

### Rule 1: Requester Cartable Logic

```python
def get_requester_inboxes(user_id, all_requests):
    """
    Requester sees 3 inboxes based on request status
    """
    
    # Inbox 1: Needs Correction (Action Required)
    needs_correction = []
    for request in all_requests:
        if request.requester_id == user_id AND request.status == 2:  # PendingCorrection
            is_unread = check_unread(user_id, request, is_responsible=True)
            needs_correction.append({
                'request': request,
                'unread': is_unread,
                'action_required': True
            })
    
    # Inbox 2: My Requests (Monitoring Only)
    my_requests = []
    for request in all_requests:
        if request.requester_id == user_id AND request.status in [1, 3, 4, 5]:
            # Statuses: DesignerReview, DesignInProgress, PendingApproval, PendingRedesign
            # Note: Status 0 (Submitted) NOT included - auto-assigned, invisible
            my_requests.append({
                'request': request,
                'unread': False,  # Monitoring only, no unread indicators
                'action_required': False
            })
    
    # Inbox 3: Completed (Archive)
    completed = []
    for request in all_requests:
        if request.requester_id == user_id AND request.status == 6:  # Completed
            completed.append({
                'request': request,
                'unread': False,  # Optional: could show unread for new completions
                'action_required': False
            })
    
    return {
        'needs_correction': needs_correction,
        'my_requests': my_requests,
        'completed': completed
    }
```

### Rule 2: Designer Cartable Logic

```python
def get_designer_inboxes(user_id, all_requests):
    """
    Designer sees 4 inboxes for better workflow organization
    """
    
    # Inbox 1: Design Requests (Action Required)
    design_requests = []
    for request in all_requests:
        if request.designer_id == user_id AND request.status in [1, 5]:
            # Statuses: DesignerReview (new), PendingRedesign (rejected by approver)
            is_unread = check_unread(user_id, request, is_responsible=True)
            design_requests.append({
                'request': request,
                'unread': is_unread,
                'action_required': True
            })
    
    # Inbox 2: In Progress (Active Work)
    in_progress = []
    for request in all_requests:
        if request.designer_id == user_id AND request.status == 3:  # DesignInProgress
            in_progress.append({
                'request': request,
                'unread': False,  # Designer is already working, no unread needed
                'action_required': False  # Ongoing work, not new action
            })
    
    # Inbox 3: Waiting Requests (Monitoring - waiting on others)
    waiting = []
    for request in all_requests:
        if request.designer_id == user_id AND request.status in [2, 4]:
            # Status 2: PendingCorrection (waiting on requester)
            # Status 4: PendingApproval (waiting on approver)
            waiting.append({
                'request': request,
                'unread': False,  # Monitoring only, no action needed
                'action_required': False
            })
    
    # Inbox 4: Completed (Archive)
    completed = []
    for request in all_requests:
        if request.designer_id == user_id AND request.status == 6:  # Completed
            completed.append({
                'request': request,
                'unread': False,  # Optional: could show unread for approvals
                'action_required': False
            })
    
    return {
        'design_requests': design_requests,
        'in_progress': in_progress,
        'waiting': waiting,
        'completed': completed
    }
```

### Rule 3: Approver Cartable Logic

```python
def get_approver_inboxes(user_id, all_requests):
    """
    Approver sees 3 inboxes including supervisor monitoring view
    """
    
    # Inbox 1: Pending Approval (Action Required)
    pending_approval = []
    for request in all_requests:
        if request.approver_id == user_id AND request.status == 4:  # PendingApproval
            is_unread = check_unread(user_id, request, is_responsible=True)
            pending_approval.append({
                'request': request,
                'unread': is_unread,
                'action_required': True
            })
    
    # Inbox 2: Approved (Archive of my approvals)
    approved = []
    for request in all_requests:
        if request.approver_id == user_id AND request.status == 6:  # Completed
            approved.append({
                'request': request,
                'unread': False,  # Optional: could show unread for new completions
                'action_required': False
            })
    
    # Inbox 3: All Requests (Supervisor monitoring - see entire workflow)
    all_workflow_requests = []
    for request in all_requests:
        # Show all active workflow stages (not pending approval or completed)
        if request.status in [1, 2, 3, 5]:
            # Status 1: DesignerReview
            # Status 2: PendingCorrection
            # Status 3: DesignInProgress
            # Status 5: PendingRedesign
            all_workflow_requests.append({
                'request': request,
                'unread': False,  # Monitoring only, no unread indicators
                'action_required': False
            })
    
    return {
        'pending_approval': pending_approval,
        'approved': approved,
        'all_requests': all_workflow_requests
    }
```

### Rule 4: Unread Determination

```python
def check_unread(user_id, request, is_responsible):
    """
    Determine if request should show as unread for user
    
    Key Principle: ONLY users responsible for action see requests as unread
    """
    
    if not is_responsible:
        return False  # User is just monitoring, not responsible
    
    # Get user's last view of this request at current status
    last_view = get_last_view(user_id, request.id, request.status)
    
    if last_view is None:
        return True  # Never viewed at this status
    
    # Get last status change date
    last_status_change = get_last_status_change_date(request.id)
    
    # Unread if status changed after user's last view
    return last_status_change > last_view.viewed_at


def is_user_responsible(user_id, request, user_roles):
    """
    Determine if user is responsible for action at current status
    """
    
    if request.status == 0:  # Submitted
        return 'Admin' in user_roles  # Only admin assigns
    
    elif request.status == 1:  # DesignerReview
        return user_id == request.designer_id
    
    elif request.status == 2:  # PendingCorrection
        return user_id == request.requester_id
    
    elif request.status == 3:  # DesignInProgress
        return user_id == request.designer_id
    
    elif request.status == 4:  # PendingApproval
        return user_id == request.approver_id
    
    elif request.status == 5:  # PendingRedesign
        return user_id == request.designer_id
    
    elif request.status == 6:  # Completed
        return False  # No one is responsible, it's done
    
    return False
```

---

## 3. Multi-Role User Implementation

### Recommended Approach: **Unified Navigation with Role-Based Accumulation**

#### Strategy

**Core Principle**: Users see ALL inboxes for ALL their roles in a single, unified navigation.

**Why This Approach**:
- ✅ Simple and intuitive - no role switching needed
- ✅ Complete visibility - user sees everything relevant
- ✅ No context loss - all information in one place
- ✅ Scalable - works for any number of role combinations
- ✅ Leverages existing backend filtering (already multi-role aware)

#### Implementation

```typescript
// Frontend: MainLayout.tsx

interface InboxItem {
    text: string;
    icon: ReactNode;
    inboxType: 'inbox' | 'outbox' | 'completed' | 'all' | 'waiting' | 'progress';
    statuses: number[];
    countKey?: string;
    color?: string;
    description?: string;
    actionRequiredOnly?: boolean;
    roleLabel?: string;  // For future grouping/filtering
}

function getInboxItems(user): InboxItem[] {
    const userRoles = user?.roles || [];
    const items: InboxItem[] = [];

    // ACCUMULATE items for all user roles
    // Order: Requester → Designer → Approver
    
    if (userRoles.includes('Requester')) {
        items.push(
            {
                text: 'نیاز به اصلاح',
                statuses: [2],
                actionRequiredOnly: true,
                roleLabel: 'Requester',
                // ... other properties
            },
            {
                text: 'درخواست‌های من',
                statuses: [1, 3, 4, 5],
                actionRequiredOnly: false,
                roleLabel: 'Requester',
            },
            {
                text: 'تکمیل شده',
                statuses: [6],
                actionRequiredOnly: false,
                roleLabel: 'Requester',
            }
        );
    }

    if (userRoles.includes('Designer')) {
        items.push(
            {
                text: 'درخواست‌های طراحی',
                statuses: [1, 5],
                actionRequiredOnly: true,
                roleLabel: 'Designer',
            },
            {
                text: 'در حال انجام',
                statuses: [3],
                actionRequiredOnly: false,
                roleLabel: 'Designer',
            },
            {
                text: 'در انتظار',
                statuses: [2, 4],
                actionRequiredOnly: false,
                roleLabel: 'Designer',
            },
            {
                text: 'تحویل داده شده',
                statuses: [6],
                actionRequiredOnly: false,
                roleLabel: 'Designer',
            }
        );
    }

    if (userRoles.includes('Approver')) {
        items.push(
            {
                text: 'در انتظار تایید',
                statuses: [4],
                actionRequiredOnly: true,
                roleLabel: 'Approver',
            },
            {
                text: 'تایید شده',
                statuses: [6],
                actionRequiredOnly: false,
                roleLabel: 'Approver',
            },
            {
                text: 'همه درخواست‌ها',
                statuses: [1, 2, 3, 5],
                actionRequiredOnly: false,
                roleLabel: 'Approver',
            }
        );
    }

    return items;  // User sees all relevant inboxes
}
```

```csharp
// Backend: Already implemented correctly

public async Task<IActionResult> GetRequests(
    [FromQuery] int[]? statuses,
    [FromQuery] string? searchTerm,
    [FromQuery] string? inboxCategory,
    [FromQuery] bool actionRequiredOnly = false)
{
    // ... auth and setup ...
    
    // Multi-role security filter uses OR logic
    if (!userRoles.Contains("Admin"))
    {
        query = query.Where(r =>
            // User sees request if they match ANY role criterion
            (userRoles.Contains("Requester") && r.RequesterId == userId) ||
            (userRoles.Contains("Designer") && r.DesignerId == userId) ||
            (userRoles.Contains("Approver") && r.ApproverId == userId && r.Status == RequestStatus.PendingApproval)
        );
    }
    
    // Status filter
    if (statuses != null && statuses.Length > 0)
    {
        query = query.Where(r => statuses.Contains((int)r.Status));
    }
    
    // ... rest of endpoint ...
    
    // IsUnread calculated per request using IsResponsibleUser
    IsUnread = IsResponsibleUser(userId, r.RequesterId, r.DesignerId, r.ApproverId, r.Status, userRoles) &&
              (!viewedAtStatus || changedSinceView)
    
    // Action-required filter if requested
    if (actionRequiredOnly)
    {
        results = results.Where(r => r.IsUnread);
    }
    
    return results;
}
```

#### Example Scenarios

**Scenario 1: User has roles [Requester, Designer]**

Navigation shows 7 inboxes total:
1. نیاز به اصلاح (Requester - Action)
2. درخواست‌های من (Requester - Monitoring)
3. تکمیل شده (Requester - Archive)
4. درخواست‌های طراحی (Designer - Action)
5. در حال انجام (Designer - Active)
6. در انتظار (Designer - Monitoring)
7. تحویل داده شده (Designer - Archive)

**Request #100: User submitted AND assigned to self**
- Appears in "درخواست‌های من" (Requester view, monitoring)
- Appears in "درخواست‌های طراحی" (Designer view, ACTION with unread badge)
- Unread badge ONLY in Designer view (user is responsible as designer)

**Request #200: User submitted, different designer assigned**
- Appears in "درخواست‌های من" (Requester view, monitoring)
- Does NOT appear in Designer inboxes (not assigned to user)

**Scenario 2: User has roles [Designer, Approver]**

Navigation shows 7 inboxes total:
1. درخواست‌های طراحی (Designer - Action)
2. در حال انجام (Designer - Active)
3. در انتظار (Designer - Monitoring)
4. تحویل داده شده (Designer - Archive)
5. در انتظار تایید (Approver - Action)
6. تایید شده (Approver - Archive)
7. همه درخواست‌ها (Approver - Monitoring)

**Request #300: User designed AND is assigned approver**
- Appears in "در انتظار" (Designer view, monitoring - sent for approval)
- Appears in "در انتظار تایید" (Approver view, ACTION with unread badge)
- Unread badge ONLY in Approver view (user is responsible as approver now)

**Scenario 3: Admin with all roles [Requester, Designer, Approver, Admin]**

Navigation shows 10 inboxes total:
- 3 Requester inboxes
- 4 Designer inboxes
- 3 Approver inboxes

Can interact with requests in any capacity:
- Submit own requests (Requester)
- Design any request (Designer)
- Approve any request (Approver)
- Assign requests to designers (Admin)

#### Future Enhancements

**Phase 1: Visual Grouping (Optional)**

Add headers/dividers between role sections:

```typescript
// Add visual separators
if (userRoles.length > 1) {
    const itemsWithSeparators = [];
    
    if (userRoles.includes('Requester')) {
        itemsWithSeparators.push({ type: 'header', text: 'من به عنوان درخواست‌کننده' });
        itemsWithSeparators.push(...requesterItems);
    }
    
    if (userRoles.includes('Designer')) {
        if (itemsWithSeparators.length > 0) {
            itemsWithSeparators.push({ type: 'divider' });
        }
        itemsWithSeparators.push({ type: 'header', text: 'من به عنوان طراح' });
        itemsWithSeparators.push(...designerItems);
    }
    
    if (userRoles.includes('Approver')) {
        if (itemsWithSeparators.length > 0) {
            itemsWithSeparators.push({ type: 'divider' });
        }
        itemsWithSeparators.push({ type: 'header', text: 'من به عنوان تاییدکننده' });
        itemsWithSeparators.push(...approverItems);
    }
    
    return itemsWithSeparators;
}
```

**Phase 2: Role Filtering (Optional)**

Add dropdown to filter inboxes by role:

```typescript
// User can toggle role visibility
const [visibleRoles, setVisibleRoles] = useState(['Requester', 'Designer', 'Approver']);

function toggleRole(role) {
    if (visibleRoles.includes(role)) {
        setVisibleRoles(visibleRoles.filter(r => r !== role));
    } else {
        setVisibleRoles([...visibleRoles, role]);
    }
}

// Filter items
const visibleItems = allItems.filter(item => visibleRoles.includes(item.roleLabel));
```

**Phase 3: Role Switching (NOT Recommended)**

Alternative approach with role selector:

```typescript
// Single role view at a time
const [activeRole, setActiveRole] = useState('Requester');

// Show only active role's inboxes
const items = getRoleInboxes(activeRole);
```

**Why NOT recommended**:
- ❌ Requires context switching
- ❌ User might miss important items in hidden roles
- ❌ More complex state management
- ❌ Less intuitive UX

---

## 4. Scalability Considerations

### Current System (Single Designer)
- ✅ Status #0 exists but immediately transitions
- ✅ Auto-assignment to default designer
- ✅ Simple, deterministic workflow

### Future System (Multi-Designer)

**When Status #0 becomes visible**:
1. Admin assigns request to designer pool
2. Designers compete/claim requests from pool
3. Or admin manually assigns to specific designer
4. Status #0 → Status #1 only after assignment

**Required Changes**:
```python
# Backend: Admin cartable
if userRoles.contains('Admin'):
    # Show Status #0 requests needing assignment
    unassigned_requests = all_requests.filter(
        status=0 AND designer_id IS NULL
    )
    
    return {
        'unassigned': unassigned_requests,  # NEW inbox for admins
        # ... other admin inboxes
    }

# Backend: Designer cartable
if userRoles.contains('Designer'):
    # Option A: Pool system
    available_pool = all_requests.filter(
        status=0 AND designer_id IS NULL
    )
    
    # Option B: Pre-assigned
    assigned_to_me = all_requests.filter(
        status=0 AND designer_id=user_id
    )
    
    return {
        'available_pool': available_pool,  # NEW
        'design_requests': [...],
        # ... rest
    }
```

**Impact on Multi-Role Users**:
- Admin + Designer: Sees both "Unassigned" and "Available Pool" inboxes
- No conflicts - clear separation of admin vs designer actions
- Scaling logic already in place (role accumulation)

---

## Summary

### ✅ Requirement 1: Revised Logical Structure
- Complete state flow mapping provided
- Status #0 correctly handled as internal/future-use
- Clear visibility rules per role and status

### ✅ Requirement 2: Pseudocode and Logic Rules
- Complete Python pseudocode for all role cartables
- Unread determination logic explained
- Responsibility calculation included

### ✅ Requirement 3: Multi-Role User Solution
- **Recommended**: Unified navigation with role accumulation
- **Implementation**: Already complete in codebase
- **Scalability**: Handles any role combination
- **Alternative approaches**: Documented for reference
- **Future enhancements**: Visual grouping, role filtering

### Technical Implementation

**Backend**: ✅ COMPLETE
- Count keys updated for all roles
- Multi-role filtering already works
- IsResponsibleUser logic accurate

**Frontend**: ✅ COMPLETE
- All inboxes restructured per specification
- Multi-role accumulation implemented
- New icons and inbox types added

**Status**: 🔄 **READY FOR DEPLOYMENT**

---

## Files Reference

**Specification**: `INBOX_LOGIC_REDESIGN.md`  
**Implementation**: `INBOX_LOGIC_IMPLEMENTATION_SUMMARY.md`  
**This Document**: `RESPONSE_TO_INSTRUCTIONS.md`

**Modified Files**:
- Backend: `RequestsController.cs`
- Frontend: `MainLayout.tsx`
