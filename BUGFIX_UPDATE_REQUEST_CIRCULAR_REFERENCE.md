# Bug Fix: Update Request Returns Circular Reference Error

## 🐛 Problem

### Current Behavior
- ✅ Request is **successfully saved** in database
- ❌ Error message "بروز خطا در ثبت درخواست" still appears
- ❌ Page reloads/shows form again instead of navigating
- ✅ Data is actually persisted (check database confirms)

### Root Cause

**Backend Issue**: `UpdateRequest` endpoint returns full `Request` entity with circular references

```csharp
// RequestsController.cs - Line 1491
return Ok(request);  // ❌ Returns full entity with relationships
```

The `Request` entity includes navigation properties:
- `RequestType` (LookupItem)
- `Requester` (ApplicationUser)
- `Designer` (ApplicationUser)
- `Approver` (ApplicationUser)
- `Attachments` (Collection)
- `Comments` (Collection)
- `RequestHistories` (Collection)

These relationships create **circular references** during JSON serialization:
```
Request → Designer → Requests → Designer → ... (infinite loop)
```

**Frontend Issue**: The serialization error is caught as a failed request

```typescript
// CreateRequestPage.tsx - Lines 540-575
try {
    await updateRequest({ requestId: Number(id), data: formData }).unwrap();
    // ✅ This should succeed but...
} catch (err: any) {
    // ❌ Catches the serialization error as if request failed
    const errorMessage = err.data?.message || err.data?.title || 'بروز خطا در ثبت درخواست';
    dispatch(showNotification({ message: errorMessage, severity: 'error' }));
}
```

### Impact
- **High**: Every edit appears to fail even though it succeeds
- Users think their changes aren't saved
- Confusing UX with error messages on success
- Same issue affects both new submissions and edits

---

## ✅ Solution

### Backend Fix: Return Simple DTO (Like CreateRequest Does)

The `CreateRequest` endpoint **already has the correct pattern** (Line 627-632):

```csharp
// ✅ CORRECT (CreateRequest)
return Ok(new {
    id = newRequest.Id,
    title = newRequest.Title,
    status = newRequest.Status,
    message = "درخواست با موفقیت ثبت شد"
});
```

**Apply same pattern to UpdateRequest**:

```csharp
// ❌ CURRENT (Line 1491):
return Ok(request);

// ✅ FIXED:
return Ok(new {
    id = request.Id,
    title = request.Title,
    status = request.Status,
    message = "درخواست با موفقیت ویرایش شد"
});
```

---

## 🔧 Implementation

### File: `RequestsController.cs`

**Location**: Line 1491 in `UpdateRequest` method

**Before**:
```csharp
                await transaction.CommitAsync();

                // Broadcast capacity update if due date changed
                if (oldDueDate != request.DueDate)
                {
                    // Update both old and new dates
                    await BroadcastCapacityUpdateAsync(oldDueDate);
                    await BroadcastCapacityUpdateAsync(request.DueDate);
                }

                return Ok(request);  // ❌ PROBLEM: Returns full entity
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"An internal error occurred: {ex.Message}");
            }
```

**After**:
```csharp
                await transaction.CommitAsync();

                // Broadcast capacity update if due date changed
                if (oldDueDate != request.DueDate)
                {
                    // Update both old and new dates
                    await BroadcastCapacityUpdateAsync(oldDueDate);
                    await BroadcastCapacityUpdateAsync(request.DueDate);
                }

                // Return simple DTO to avoid circular references (same pattern as CreateRequest)
                return Ok(new
                {
                    id = request.Id,
                    title = request.Title,
                    status = request.Status,
                    message = "درخواست با موفقیت ویرایش شد"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"An internal error occurred: {ex.Message}");
            }
```

---

## 📊 Before vs After

### Before Fix:

**What actually happens**:
1. User clicks "ذخیره تغییرات"
2. ✅ Backend saves changes successfully
3. ❌ Backend tries to return full `Request` entity
4. ❌ JSON serialization fails (circular reference)
5. ❌ Frontend receives error response
6. ❌ Shows "بروز خطا در ثبت درخواست"
7. ❌ User thinks edit failed (but it actually saved!)

**User Experience**:
- 😡 Confusing: "Error but my changes are saved?"
- 😡 Clicking edit again shows the saved data
- 😡 Form reloads instead of navigating away

### After Fix:

**What happens**:
1. User clicks "ذخیره تغییرات"
2. ✅ Backend saves changes successfully
3. ✅ Backend returns simple DTO `{ id, title, status, message }`
4. ✅ Frontend receives success response
5. ✅ Shows "درخواست با موفقیت ویرایش شد!"
6. ✅ Navigates to request detail page
7. ✅ User sees updated request

**User Experience**:
- 😊 Clear success message
- 😊 Smooth navigation to detail view
- 😊 Confidence that changes are saved

---

## 🔍 Related Issues

### Similar Pattern in Other Endpoints

Many other endpoints also return full entities and might have the same issue:

1. **Line 1057** - `StartDesign`: `return Ok(request);`
2. **Line 1093** - `CompleteDesign`: `return Ok(request);`
3. **Line 1152** - `ResubmitRequest`: `return Ok(request);`
4. **Line 1186** - `ResubmitForApproval`: `return Ok(request);`

**Recommendation**: Audit all endpoints and replace `return Ok(request)` with simple DTOs

### Alternative Solution: Configure JSON Serialization

Could also configure `Program.cs` to handle circular references:

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
```

**But**: Returning simple DTOs is **better practice** because:
- ✅ Explicit control over response shape
- ✅ No accidental data leakage
- ✅ Better performance (smaller payloads)
- ✅ Clearer API contract

---

## 🧪 Testing

### Test Cases:

#### 1. **Create New Request**
- [ ] Fill form and submit
- [ ] Should show success message
- [ ] Should navigate to `/requests`
- [ ] Should NOT show error message

#### 2. **Edit Existing Request** (Primary Bug)
- [ ] Open request in edit mode
- [ ] Change title or other field
- [ ] Click "ذخیره تغییرات"
- [ ] Should show "درخواست با موفقیت ویرایش شد!"
- [ ] Should navigate to `/requests/{id}`
- [ ] Should NOT show "بروز خطا در ثبت درخواست"

#### 3. **Edit with Validation Error**
- [ ] Clear required field
- [ ] Try to submit
- [ ] Should show validation error
- [ ] Should NOT save or navigate

#### 4. **Edit with Network Error**
- [ ] Disconnect network
- [ ] Try to submit
- [ ] Should show network error
- [ ] Should NOT navigate

---

## 📚 Documentation

### API Response Contract

**POST /api/requests** (Create) ✅ Already correct:
```json
{
    "id": 123,
    "title": "عنوان درخواست",
    "status": 1,
    "message": "درخواست با موفقیت ثبت شد"
}
```

**PUT /api/requests/{id}** (Update) ✅ Now fixed to match:
```json
{
    "id": 123,
    "title": "عنوان درخواست",
    "status": 1,
    "message": "درخواست با موفقیت ویرایش شد"
}
```

### Frontend Handling

The frontend already expects simple response:

```typescript
// CreateRequestPage.tsx - Lines 544-558
if (isEditMode) {
    const result = await updateRequest({
        requestId: Number(id),
        data: formData
    }).unwrap();
    
    console.log('Update result:', result);  // Will now log simple DTO
    
    dispatch(showNotification({
        message: 'درخواست با موفقیت ویرایش شد!',
        severity: 'success'
    }));
    
    navigate(`/requests/${id}`);  // Will now execute!
}
```

---

## 🎯 Summary

**Problem**: UpdateRequest returns full entity → circular reference → JSON error → frontend thinks it failed  
**Solution**: Return simple DTO (same as CreateRequest)  
**Result**: Successful edit shows success message and navigates correctly  
**Impact**: Critical UX bug fixed for all request edits  

**Status**: ✅ **READY TO IMPLEMENT**  
**Complexity**: **Low** (1 line change)  
**Priority**: **HIGH** (affects every edit operation)

---

## 📝 Related Files

- **Backend**: `RequestsController.cs` (Line 1491)
- **Frontend**: `CreateRequestPage.tsx` (Lines 544-575)
- **Related Bug**: `BUGFIX_REQUEST_SUBMISSION_PARSING_ERROR.md` (Similar issue for CreateRequest, already fixed)
