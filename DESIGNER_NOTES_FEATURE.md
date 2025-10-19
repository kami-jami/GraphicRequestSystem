# Designer Private Notes Feature

## 🎯 **Feature Overview**

**Purpose:**  
Allow designers to create, edit, and delete personal notes for each request they are working on. These notes are **completely confidential** and only visible to the designer who created them.

**Security Level:** 🔒 **MAXIMUM**  
- Only accessible to designers with the "Designer" role
- Only visible to the designer assigned to the request
- Other roles (Requester, Approver, Admin) have **ZERO** access
- Backend enforces strict authorization at every endpoint

---

## 🏗️ **Architecture**

### **Database Schema**

**Table: `DesignerNotes`**

```sql
CREATE TABLE [dbo].[DesignerNotes] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [RequestId] INT NOT NULL,
    [DesignerId] NVARCHAR(450) NOT NULL,
    [NoteText] NVARCHAR(5000) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NULL,
    [IsDeleted] BIT NOT NULL DEFAULT 0,  -- Soft delete for data retention
    
    CONSTRAINT [FK_DesignerNotes_Requests] 
        FOREIGN KEY ([RequestId]) REFERENCES [Requests]([Id]) ON DELETE CASCADE,
    
    CONSTRAINT [FK_DesignerNotes_Users] 
        FOREIGN KEY ([DesignerId]) REFERENCES [AspNetUsers]([Id]) ON DELETE NO ACTION
);

-- Index for fast queries
CREATE INDEX [IX_DesignerNotes_RequestId_DesignerId_IsDeleted] 
    ON [DesignerNotes] ([RequestId], [DesignerId], [IsDeleted]);
```

**Key Features:**
- ✅ Soft delete (IsDeleted flag) - notes never truly deleted from database
- ✅ Timestamps for creation and updates
- ✅ Cascade delete when request is deleted
- ✅ Indexed for performance
- ✅ 5000 character limit per note

---

## 🔒 **Security Implementation**

### **Triple-Layer Security**

#### **Layer 1: Role-Based Authorization**
```csharp
[Authorize(Roles = "Designer")]  // ← Only designers can access this controller
public class DesignerNotesController : ControllerBase
```

#### **Layer 2: Request Assignment Verification**
```csharp
// Verify the designer is assigned to this request
if (request.DesignerId != designerId)
{
    return Forbid(); // ← Not your request = no access
}
```

#### **Layer 3: Ownership Verification**
```csharp
// Only the designer who created the note can modify/delete it
if (note.DesignerId != designerId)
{
    return Forbid(); // ← Not your note = no access
}
```

### **Access Control Matrix**

| Role | View Notes | Create | Edit | Delete |
|------|------------|--------|------|--------|
| **Designer (Own Notes)** | ✅ | ✅ | ✅ | ✅ |
| **Designer (Other's Notes)** | ❌ | ❌ | ❌ | ❌ |
| **Requester** | ❌ | ❌ | ❌ | ❌ |
| **Approver** | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ❌ | ❌ | ❌ | ❌ |

**Even admins cannot see designer notes!** This ensures designers can keep truly private workflow notes without fear of management oversight.

---

## 📡 **API Endpoints**

### **Base URL:** `/api/designernotes`

All endpoints require:
- ✅ Valid JWT token
- ✅ "Designer" role
- ✅ Designer must be assigned to the request

---

### **1. Get Notes for Request**

**GET** `/api/designernotes/request/{requestId}`

Retrieves all notes for a specific request created by the authenticated designer.

**Authorization:**
- Must be a designer
- Must be assigned to the request

**Response:** `200 OK`
```json
[
    {
        "id": 1,
        "requestId": 42,
        "designerId": "user-123",
        "designerName": "احمد رضایی",
        "noteText": "باید رنگ بنفش را به آبی تغییر داد",
        "createdAt": "2025-10-19T10:30:00Z",
        "updatedAt": "2025-10-19T14:20:00Z"
    },
    {
        "id": 2,
        "requestId": 42,
        "designerId": "user-123",
        "designerName": "احمد رضایی",
        "noteText": "مشتری تماس گرفت - می‌خواهد لوگو بزرگتر باشد",
        "createdAt": "2025-10-19T15:00:00Z",
        "updatedAt": null
    }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a designer or not assigned to request
- `404 Not Found` - Request doesn't exist

---

### **2. Get Single Note**

**GET** `/api/designernotes/{id}`

Retrieves a specific note by ID.

**Authorization:**
- Must be a designer
- Must be the creator of the note

**Response:** `200 OK`
```json
{
    "id": 1,
    "requestId": 42,
    "designerId": "user-123",
    "designerName": "احمد رضایی",
    "noteText": "باید رنگ بنفش را به آبی تغییر داد",
    "createdAt": "2025-10-19T10:30:00Z",
    "updatedAt": "2025-10-19T14:20:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the creator of this note
- `404 Not Found` - Note doesn't exist or was deleted

---

### **3. Create Note**

**POST** `/api/designernotes/request/{requestId}`

Creates a new note for a request.

**Authorization:**
- Must be a designer
- Must be assigned to the request

**Request Body:**
```json
{
    "noteText": "این یک یادداشت تست است"
}
```

**Validation:**
- `noteText` is required
- Maximum 5000 characters
- Whitespace is trimmed

**Response:** `201 Created`
```json
{
    "id": 3,
    "requestId": 42,
    "designerId": "user-123",
    "designerName": "احمد رضایی",
    "noteText": "این یک یادداشت تست است",
    "createdAt": "2025-10-19T16:00:00Z",
    "updatedAt": null
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (empty or too long)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not assigned to this request
- `404 Not Found` - Request doesn't exist

---

### **4. Update Note**

**PUT** `/api/designernotes/{id}`

Updates an existing note.

**Authorization:**
- Must be a designer
- Must be the creator of the note

**Request Body:**
```json
{
    "noteText": "یادداشت به‌روزرسانی شده"
}
```

**Validation:**
- `noteText` is required
- Maximum 5000 characters
- Whitespace is trimmed

**Response:** `200 OK`
```json
{
    "id": 3,
    "requestId": 42,
    "designerId": "user-123",
    "designerName": "احمد رضایی",
    "noteText": "یادداشت به‌روزرسانی شده",
    "createdAt": "2025-10-19T16:00:00Z",
    "updatedAt": "2025-10-19T16:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the creator of this note
- `404 Not Found` - Note doesn't exist or was deleted

---

### **5. Delete Note**

**DELETE** `/api/designernotes/{id}`

Soft deletes a note (sets IsDeleted = true).

**Authorization:**
- Must be a designer
- Must be the creator of the note

**Response:** `200 OK`
```json
{
    "message": "Note deleted successfully."
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the creator of this note
- `404 Not Found` - Note doesn't exist or already deleted

**Note:** This is a soft delete - data is retained in database for audit purposes.

---

## 🎨 **Frontend Implementation**

### **Component: DesignerNotes.tsx**

**Location:** `graphic-request-client/src/components/request-details/DesignerNotes.tsx`

**Features:**
- ✅ Real-time CRUD operations
- ✅ Inline editing
- ✅ Confirmation dialog for delete
- ✅ Character count for long notes
- ✅ Timestamps with "edited" indicator
- ✅ Loading states
- ✅ Error handling (silently hides if unauthorized)
- ✅ Responsive design
- ✅ Modern Material-UI styling

**Visual Design:**

```
┌─────────────────────────────────────────────────────────┐
│ 📝 یادداشت‌های شخصی طراح                               │
│ 🔒 فقط شما می‌توانید این یادداشت‌ها را مشاهده کنید    │
├─────────────────────────────────────────────────────────┤
│ ℹ️  این یادداشت‌ها کاملاً محرمانه هستند و تنها توسط  │
│    شما قابل مشاهده می‌باشند. سایر نقش‌ها دسترسی       │
│    ندارند.                                              │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ یادداشت جدید اضافه کنید...                         │ │
│ │                                                     │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│ [➕ افزودن یادداشت]                                    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📅 1403/07/28 10:30    [ویرایش شده]    [✏️] [🗑️]  │ │
│ │                                                     │ │
│ │ باید رنگ بنفش را به آبی تغییر داد                  │ │
│ │ مشتری خواسته فونت بزرگتر شود                       │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📅 1403/07/28 15:00              [✏️] [🗑️]        │ │
│ │                                                     │ │
│ │ مشتری تماس گرفت - می‌خواهد لوگو بزرگتر باشد       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 **Integration with RequestDetailPage**

**Location:** `graphic-request-client/src/pages/RequestDetailPage.tsx`

**Placement:** Below tabs section, above actions

**Conditional Rendering:**
```tsx
{!isApproverView && user?.roles?.includes('Designer') && (
    <Box sx={{ mt: 3 }}>
        <DesignerNotes requestId={requestId} />
    </Box>
)}
```

**Visibility Rules:**
- ✅ Hidden from Approver view (approval workflow)
- ✅ Only shown if user has "Designer" role
- ✅ API enforces additional security (must be assigned to request)

---

## 📊 **Use Cases**

### **Use Case 1: Technical Reminders**

**Scenario:** Designer needs to remember specific technical details

**Example:**
```
یادداشت:
"فایل PSD در سیستم قدیمی ذخیره شده - باید قبل از تحویل فونت‌ها را 
 Embed کنم. رنگ نهایی: #3B82F6"
```

**Value:** No need to search through emails or messages later

---

### **Use Case 2: Client Feedback**

**Scenario:** Client calls with verbal feedback not documented in system

**Example:**
```
یادداشت:
"تماس تلفنی 1403/07/28:
 - لوگو باید 20% بزرگتر شود
 - رنگ قرمز را به نارنجی تغییر دهیم
 - تاریخ تحویل یک روز زودتر شد!"
```

**Value:** Important verbal communications preserved

---

### **Use Case 3: Workflow Notes**

**Scenario:** Designer switching between multiple projects

**Example:**
```
یادداشت:
"✅ تصویر اصلی Approve شد
 🔄 منتظر تایید فونت هستم
 ⏳ باید mockup را فردا ارسال کنم"
```

**Value:** Quick status check when returning to project

---

### **Use Case 4: Design Decisions**

**Scenario:** Explaining why certain design choices were made

**Example:**
```
یادداشت:
"چرا gradient استفاده کردم؟
 - مشتری flat design نمی‌خواست
 - برند رقیب gradient دارد
 - در موبایل بهتر دیده می‌شود"
```

**Value:** Context for future reference or team handoff

---

## 🧪 **Testing Scenarios**

### **Test 1: Basic CRUD Operations**

**Steps:**
1. Login as Designer A
2. Navigate to a request assigned to you
3. Create a new note: "تست یادداشت اول"
4. Verify note appears in list
5. Edit note to: "تست یادداشت ویرایش شده"
6. Verify "ویرایش شده" badge appears
7. Delete note
8. Verify note disappears

**Expected:** ✅ All operations succeed

---

### **Test 2: Security - Not Assigned Designer**

**Steps:**
1. Login as Designer A
2. Note Request #123 (assigned to Designer A)
3. Create note on Request #123
4. Logout, login as Designer B
5. Try to access Request #123 detail page

**Expected:** ✅ Designer B sees NO notes section (component hidden)

---

### **Test 3: Security - Non-Designer Roles**

**Steps:**
1. Login as Designer, create note on Request #123
2. Logout, login as Requester (who created Request #123)
3. View Request #123

**Expected:** ✅ Requester sees NO notes section

**Repeat for:**
- Approver role → ✅ No notes visible
- Admin role → ✅ No notes visible

---

### **Test 4: Multi-Designer Scenario**

**Setup:**
- Request #123 initially assigned to Designer A
- Designer A creates 3 notes
- Request reassigned to Designer B

**Steps:**
1. Login as Designer A
2. Try to view Request #123

**Expected:** ✅ Designer A cannot see notes (no longer assigned)

3. Login as Designer B
4. View Request #123

**Expected:** ✅ Designer B sees NO notes (they weren't created by them)

5. Designer B creates new note

**Expected:** ✅ Designer B only sees their own note

---

### **Test 5: Long Note Handling**

**Steps:**
1. Create note with 4999 characters
2. Verify successful save
3. Try to create note with 5001 characters

**Expected:** 
- ✅ 4999 chars: Success
- ❌ 5001 chars: Error message shown

---

### **Test 6: Empty Note Prevention**

**Steps:**
1. Try to create note with only spaces: "   "
2. Try to create completely empty note: ""

**Expected:** ✅ "افزودن یادداشت" button remains disabled

---

### **Test 7: Concurrent Editing**

**Steps:**
1. Open Request #123 in two browser tabs (same designer)
2. Tab 1: Edit note #1
3. Tab 2: Edit note #1 simultaneously
4. Tab 1: Save
5. Tab 2: Save

**Expected:** ✅ Last save wins (no data loss)

---

### **Test 8: Soft Delete Verification**

**Steps:**
1. Create note, get note ID from network tab
2. Delete note from UI
3. Query database directly:
   ```sql
   SELECT * FROM DesignerNotes WHERE Id = {noteId}
   ```

**Expected:** ✅ Record exists with `IsDeleted = 1`

---

## 📈 **Performance Considerations**

### **Database Queries**

**Optimized Indexes:**
```sql
CREATE INDEX [IX_DesignerNotes_RequestId_DesignerId_IsDeleted] 
    ON [DesignerNotes] ([RequestId], [DesignerId], [IsDeleted]);
```

**Query Performance:**
```sql
-- Get notes for request (indexed query)
SELECT * FROM DesignerNotes 
WHERE RequestId = @RequestId 
  AND DesignerId = @DesignerId 
  AND IsDeleted = 0
ORDER BY CreatedAt DESC;
```

**Estimated:** < 5ms for typical request with 10 notes

---

### **API Response Times**

| Endpoint | Operation | Expected Time |
|----------|-----------|---------------|
| GET /request/{id} | List notes | < 50ms |
| POST /request/{id} | Create note | < 100ms |
| PUT /{id} | Update note | < 80ms |
| DELETE /{id} | Soft delete | < 60ms |

---

### **Frontend Performance**

**RTK Query Caching:**
- Notes cached per request
- Automatic refetch on create/update/delete
- No unnecessary network calls

**Component Optimization:**
- Lazy loading (only renders for designers)
- Optimistic updates for better UX
- Debounced auto-save (future feature)

---

## 🚀 **Future Enhancements**

### **Phase 2: Advanced Features**

1. **Rich Text Editor**
   - Bold, italic, bullet points
   - Code snippets for technical notes
   - Markdown support

2. **Attachments**
   - Attach images/files to notes
   - Screenshot directly from browser
   - Link to external resources

3. **Search & Filter**
   - Full-text search across all notes
   - Filter by date range
   - Tag system for organization

4. **Templates**
   - Pre-defined note templates
   - "Checklist" template
   - "Design Review" template

5. **Auto-Save**
   - Save draft as user types
   - Never lose work
   - Conflict resolution

6. **Export**
   - Export all notes for a request
   - PDF generation
   - CSV export

---

## 🔐 **Privacy & Compliance**

### **Data Retention**

**Policy:** Soft delete only
- Notes are never permanently deleted
- Required for audit trails
- Compliance with data retention laws

**Purge Strategy (Future):**
```sql
-- Purge notes older than 2 years for completed requests
DELETE FROM DesignerNotes
WHERE IsDeleted = 1
  AND UpdatedAt < DATEADD(YEAR, -2, GETDATE())
  AND RequestId IN (
      SELECT Id FROM Requests WHERE Status = 6  -- Completed
  );
```

---

### **GDPR Compliance**

If user requests data deletion (Right to be Forgotten):

```sql
-- Anonymize designer notes
UPDATE DesignerNotes
SET NoteText = '[REDACTED]',
    IsDeleted = 1,
    UpdatedAt = GETDATE()
WHERE DesignerId = @UserId;
```

---

## 📚 **Documentation Summary**

### **Files Created/Modified**

**Backend:**
- ✅ `Core/Entities/DesignerNote.cs` - Entity model
- ✅ `DTOs/CreateDesignerNoteDto.cs` - Create DTO
- ✅ `DTOs/UpdateDesignerNoteDto.cs` - Update DTO
- ✅ `DTOs/DesignerNoteDto.cs` - Response DTO
- ✅ `Controllers/DesignerNotesController.cs` - API endpoints
- ✅ `Infrastructure/Data/AppDbContext.cs` - EF configuration
- ✅ `Migrations/[timestamp]_AddDesignerNotes.cs` - Migration

**Frontend:**
- ✅ `services/apiSlice.ts` - RTK Query endpoints
- ✅ `components/request-details/DesignerNotes.tsx` - UI component
- ✅ `pages/RequestDetailPage.tsx` - Integration

---

## ✅ **Deployment Checklist**

### **Pre-Deployment**
- [x] Backend code complete
- [x] Frontend code complete
- [x] Database migration created
- [ ] Database migration applied to dev
- [ ] Database migration applied to staging
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] Security audit completed
- [ ] Documentation complete

### **Deployment**
- [ ] Backup production database
- [ ] Run migration on production
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Smoke test all endpoints
- [ ] Verify designer can create notes
- [ ] Verify other roles cannot see notes

### **Post-Deployment**
- [ ] Monitor error logs for 24 hours
- [ ] Check database query performance
- [ ] Gather user feedback
- [ ] Document any issues

---

## 🎓 **Developer Notes**

### **Key Design Decisions**

1. **Why Soft Delete?**
   - Audit trail preservation
   - Accidental deletion recovery
   - Compliance requirements

2. **Why No Admin Access?**
   - Builds designer trust
   - Encourages honest note-taking
   - Separates private vs. public comments

3. **Why 5000 Character Limit?**
   - Prevents database bloat
   - Encourages concise notes
   - Still allows detailed information

4. **Why No Real-Time Sync?**
   - Not needed (single user context)
   - Reduces complexity
   - May add in Phase 2

---

## Summary

**What We Built:**
- Complete CRUD system for designer private notes
- Triple-layer security (role, assignment, ownership)
- Modern, intuitive UI with inline editing
- Soft delete for data retention
- Optimized database queries

**Impact:**
- ✅ Designers can keep private workflow notes
- ✅ No information lost in verbal communications
- ✅ Better project context when switching tasks
- ✅ Zero visibility to other roles (complete privacy)
- ✅ Audit trail for compliance

**Status:** ✅ **Ready for Testing**

