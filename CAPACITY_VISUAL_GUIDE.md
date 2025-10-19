# Visual Guide: Capacity Calculation Fix

## 🎨 Before vs After Comparison

### **Scenario: 2025-10-20 (Urgent Priority)**

**System Settings:**
- MaxUrgentRequestsPerDay = 2

**Database State:**
```
┌─────┬───────────────────┬──────────┬───────────┬────────────────┐
│ ID  │ Title             │ Priority │ DueDate   │ Status         │
├─────┼───────────────────┼──────────┼───────────┼────────────────┤
│ 100 │ Logo Design       │ Urgent   │ 2025-10-20│ Completed (6)  │
│ 101 │ Banner Design     │ Urgent   │ 2025-10-20│ Completed (6)  │
│ 102 │ Card Design       │ Normal   │ 2025-10-20│ Completed (6)  │
└─────┴───────────────────┴──────────┴───────────┴────────────────┘
```

---

### ❌ **OLD BEHAVIOR (Buggy)**

**Backend Capacity Calculation:**
```sql
SELECT COUNT(*) 
FROM Requests 
WHERE DueDate = '2025-10-20' 
  AND Priority = Urgent;
  -- No Status filter!
```

**Result:** Count = 2 (includes completed)

**Validation Logic:**
```csharp
if (requestCountForDay >= maxUrgent) // 2 >= 2
{
    return BadRequest("ظرفیت تکمیل شده است"); // ❌ REJECT!
}
```

**Frontend Display:**
```typescript
// API returns:
{
  urgentSlotsUsed: 2,     // Wrong! Counting completed
  urgentSlotsTotal: 2,
  urgentSlotsRemaining: 0  // Calculated: 2 - 2 = 0
}

// UI shows:
┌─────────────────────────────────────┐
│ 🔴 ظرفیت تکمیل                     │
│ 0 از 2 ظرفیت باقی‌مانده           │
│ ████████████ 0%                     │
└─────────────────────────────────────┘
```

**User Experience:**
```
User selects 2025-10-20 → Sees "Full Capacity" → Cannot submit ❌
```

---

### ✅ **NEW BEHAVIOR (Fixed)**

**Backend Capacity Calculation:**
```sql
SELECT COUNT(*) 
FROM Requests 
WHERE DueDate = '2025-10-20' 
  AND Priority = Urgent
  AND Status != Completed;  -- ✅ Exclude completed!
```

**Result:** Count = 0 (only active requests)

**Validation Logic:**
```csharp
if (requestCountForDay >= maxUrgent) // 0 >= 2
{
    // Not executed - capacity available!
}
// ✅ ACCEPT submission
```

**Frontend Display:**
```typescript
// API returns:
{
  urgentSlotsUsed: 0,      // Correct! Only active requests
  urgentSlotsTotal: 2,
  urgentSlotsRemaining: 2   // Calculated: 2 - 0 = 2
}

// UI shows:
┌─────────────────────────────────────┐
│ ✅ ظرفیت کافی                       │
│ 2 از 2 ظرفیت باقی‌مانده           │
│ ████████████ 100%                   │
└─────────────────────────────────────┘
```

**User Experience:**
```
User selects 2025-10-20 → Sees "Sufficient Capacity" → Submits successfully ✅
```

---

## 📊 Capacity Status Visualization

### **Status 1: Sufficient Capacity (>30%)**

```
┌───────────────────────────────────────────────────────┐
│ 2025-10-22 | Normal Priority                         │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ✅ ظرفیت کافی                4 از 5 ظرفیت باقی      │
│                                                       │
│  ████████████████░░░░ 80%                            │
│                                                       │
│  Active Requests:                                    │
│  ┌─────────────────────────────────────┐            │
│  │ [●] Request #201 - DesignInProgress │            │
│  └─────────────────────────────────────┘            │
│                                                       │
│  Completed (Don't count):                            │
│  ┌─────────────────────────────────────┐            │
│  │ [✓] Request #198 - Completed        │            │
│  │ [✓] Request #199 - Completed        │            │
│  └─────────────────────────────────────┘            │
└───────────────────────────────────────────────────────┘
```

**Color:** Green (#4caf50)  
**Icon:** ✅ CheckCircle  
**Action:** Safe to book

---

### **Status 2: Limited Capacity (1-30%)**

```
┌───────────────────────────────────────────────────────┐
│ 2025-10-23 | Urgent Priority                         │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ⚠️ ظرفیت محدود               1 از 2 ظرفیت باقی      │
│                                                       │
│  ██████████░░░░░░░░░░ 50%                            │
│                                                       │
│  Active Requests:                                    │
│  ┌─────────────────────────────────────┐            │
│  │ [●] Request #305 - PendingApproval  │            │
│  └─────────────────────────────────────┘            │
│                                                       │
│  ⚠️ Warning: Date is filling up!                     │
│     Consider alternative dates if possible.          │
└───────────────────────────────────────────────────────┘
```

**Color:** Orange (#ff9800)  
**Icon:** ⚠️ WarningAmber  
**Action:** Can book but hurry

---

### **Status 3: Full Capacity (0%)**

```
┌───────────────────────────────────────────────────────┐
│ 2025-10-24 | Urgent Priority                         │
├───────────────────────────────────────────────────────┤
│                                                       │
│  🚫 ظرفیت تکمیل               0 از 2 ظرفیت باقی      │
│                                                       │
│  ░░░░░░░░░░░░░░░░░░░░ 0%                             │
│                                                       │
│  Active Requests:                                    │
│  ┌─────────────────────────────────────┐            │
│  │ [●] Request #401 - DesignInProgress │            │
│  │ [●] Request #402 - PendingRedesign  │            │
│  └─────────────────────────────────────┘            │
│                                                       │
│  🚫 This date is unavailable                         │
│     Please select another date.                      │
└───────────────────────────────────────────────────────┘
```

**Color:** Red (#f44336)  
**Icon:** 🚫 BlockIcon  
**Action:** Cannot book - disabled in calendar

---

## 🔄 Status Lifecycle & Capacity

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────┘

                        USER SUBMITS REQUEST
                                │
                                ▼
                    ┌───────────────────────┐
                    │   0: Submitted        │ ◄── COUNTS TOWARD CAPACITY
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ 1: DesignerReview     │ ◄── COUNTS TOWARD CAPACITY
                    └───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌───────────────────────┐   ┌───────────────────────┐
        │ 2: PendingCorrection  │   │ 3: DesignInProgress   │
        │   (Requester)         │   │   (Designer Working)  │
        └───────────────────────┘   └───────────────────────┘
                    │                       │
          COUNTS ◄──┘                       └──► COUNTS
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │ 4: PendingApproval    │ ◄── COUNTS
                                └───────────────────────┘
                                            │
                                ┌───────────┴───────────┐
                                │                       │
                                ▼                       ▼
                    ┌───────────────────────┐   ┌───────────────────────┐
                    │ 5: PendingRedesign    │   │ 6: Completed          │
                    │   (Needs Changes)     │   │   ✅ DONE!            │
                    └───────────────────────┘   └───────────────────────┘
                                │                       │
                      COUNTS ◄──┘                       └──► DOES NOT COUNT!
                                │
                                └─────────────┐
                                              │
                                              ▼
                                ┌───────────────────────┐
                                │ 6: Completed          │
                                │   (After Redesign)    │
                                └───────────────────────┘
                                              │
                                              └──► CAPACITY RELEASED ✅
```

**Key Points:**
- ✅ **Statuses 0-5**: Occupy capacity (active work)
- ✅ **Status 6 (Completed)**: Releases capacity
- ✅ Completed requests can remain in database forever without blocking dates
- ✅ One date can have: unlimited completed + N active (where N ≤ max capacity)

---

## 🎯 Real-World Examples

### **Example 1: Busy Designer Day**

**Date: 2025-10-25 | Normal Priority | Max = 5**

```
Morning (9 AM):
┌────────────────────────────────────────┐
│ Active: 2 requests                     │
│ Completed: 0 requests                  │
│                                        │
│ Status: ✅ Available (3 of 5 remaining)│
│ Calculation: 5 - 2 = 3 slots          │
└────────────────────────────────────────┘

Afternoon (3 PM):
┌────────────────────────────────────────┐
│ Active: 4 requests                     │
│ Completed: 1 request (finished today)  │
│                                        │
│ Status: ⚠️ Limited (1 of 5 remaining)  │
│ Calculation: 5 - 4 = 1 slot           │
└────────────────────────────────────────┘

End of Day (6 PM):
┌────────────────────────────────────────┐
│ Active: 5 requests                     │
│ Completed: 2 requests (finished today) │
│                                        │
│ Status: 🚫 Full (0 of 5 remaining)     │
│ Calculation: 5 - 5 = 0 slots          │
└────────────────────────────────────────┘
```

**Next Day:**
- Completed requests from yesterday: 7 total
- New active requests: 2
- **Status: ✅ Available (3 of 5)**
- **Why?** Yesterday's completed work doesn't carry over!

---

### **Example 2: Historical Date**

**Date: 2025-09-15 (Old date with many completed requests)**

```
Database State:
┌─────┬──────────────┬────────────┬───────────────┐
│ ID  │ Title        │ DueDate    │ Status        │
├─────┼──────────────┼────────────┼───────────────┤
│ 50  │ Old Design 1 │ 2025-09-15 │ Completed (6) │
│ 51  │ Old Design 2 │ 2025-09-15 │ Completed (6) │
│ 52  │ Old Design 3 │ 2025-09-15 │ Completed (6) │
│ 53  │ Old Design 4 │ 2025-09-15 │ Completed (6) │
│ 54  │ Old Design 5 │ 2025-09-15 │ Completed (6) │
└─────┴──────────────┴────────────┴───────────────┘

❌ OLD SYSTEM: Count = 5 → Date shows as FULL
✅ NEW SYSTEM: Count = 0 → Date shows as AVAILABLE

Note: User can't actually select this date (it's in the past),
but this shows why the fix matters for current dates!
```

---

## 📱 Mobile UI Layout

```
┌─────────────────────────────────────┐
│ 📱 Mobile View (Portrait)           │
├─────────────────────────────────────┤
│                                     │
│  [Calendar Icon] 2025-10-22         │
│  ────────────────────────────       │
│                                     │
│  ✅ ظرفیت کافی                      │
│  4 از 5 ظرفیت باقی‌مانده           │
│                                     │
│  ████████████████░░░░               │
│  80% Available                      │
│                                     │
│  ────────────────────────────       │
│                                     │
│  📊 Capacity Legend:                │
│  • ✅ Sufficient (>30%)             │
│  • ⚠️ Limited (1-30%)               │
│  • 🚫 Full (0%)                     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🖥️ Desktop UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ 🖥️ Desktop View (Wide)                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Priority: [Normal ▼]              Date: [2025-10-22] [📅]      │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ ظرفیت کافی                    4 از 5 ظرفیت باقی‌مانده   │ │
│  │                                                            │ │
│  │ ████████████████░░░░ 80%                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📊 Capacity Guide:                                         │ │
│  │ ✅ Sufficient    ⚠️ Limited (< 30%)    🚫 Full            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✅ Testing Checklist

### **Visual Test 1: Capacity Colors**
- [ ] Green for >30% available
- [ ] Orange for 1-30% available
- [ ] Red for 0% available
- [ ] Gray for no data

### **Visual Test 2: Progress Bar**
- [ ] Bar fills proportionally to capacity used
- [ ] Color matches status (green/orange/red)
- [ ] Smooth animation on selection

### **Visual Test 3: Responsive Layout**
- [ ] Stacks vertically on mobile
- [ ] Horizontal layout on desktop
- [ ] Legend visible on all screen sizes

### **Functional Test: Accuracy**
- [ ] Numbers match backend calculation
- [ ] Completed requests not counted
- [ ] Active requests counted correctly
- [ ] Updates in real-time

---

## 🎓 User Education

### **Help Tooltip Text**

```
💡 How Date Capacity Works:

Each date has a limit on how many requests can be actively 
worked on by designers.

✅ Sufficient Capacity (Green)
   More than 30% of slots available
   → Safe to select this date

⚠️ Limited Capacity (Orange)
   Less than 30% of slots available
   → Date is filling up, book soon

🚫 Full Capacity (Red)
   No slots remaining
   → Cannot select, choose another date

Note: Completed requests don't count toward capacity.
Only active work in progress affects availability.
```

---

## Summary

This visual guide demonstrates:
1. ✅ **Before/After** - How the bug affected users
2. ✅ **Status Visualization** - What each capacity level looks like
3. ✅ **Lifecycle Diagram** - When requests count/don't count
4. ✅ **Real Examples** - Practical scenarios
5. ✅ **UI Layouts** - Mobile and desktop views
6. ✅ **User Education** - Help text for end users

The fix ensures **visual clarity**, **accurate data**, and **consistent user experience** across all devices and user roles.
