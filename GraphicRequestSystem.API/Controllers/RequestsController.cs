using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Enums;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using GraphicRequestSystem.API.Infrastructure.Strategies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using System.Security.Claims;
using System.Security.Claims;
using GraphicRequestSystem.API.Helpers;
using GraphicRequestSystem.API.Core.Interfaces;

namespace GraphicRequestSystem.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly RequestDetailStrategyFactory _strategyFactory;
        private readonly UserManager<AppUser> _userManager;
        private readonly INotificationService _notificationService;

        public RequestsController(
            AppDbContext context,
            RequestDetailStrategyFactory strategyFactory,
            UserManager<AppUser> userManager,
            INotificationService notificationService)
        {
            _context = context;
            _strategyFactory = strategyFactory;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        // GET: api/Requests
        [HttpGet]
        public async Task<IActionResult> GetRequests([FromQuery] int[]? statuses, [FromQuery] string? searchTerm)
        {
            var userId = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            var currentUser = await _userManager.FindByIdAsync(userId);
            var userRoles = await _userManager.GetRolesAsync(currentUser);

            // --- 2. ایجاد کوئری پایه ---
            var query = _context.Requests.AsQueryable();

            // --- 3. اعمال فیلتر امنیتی بر اساس نقش کاربر ---
            // اگر کاربر "Admin" نباشد، داده‌ها را بر اساس نقش‌هایش فیلتر می‌کنیم.
            if (!userRoles.Contains("Admin"))
            {
                query = query.Where(r =>
                    // یک درخواست‌دهنده فقط درخواست‌های خودش را می‌بیند
                    (userRoles.Contains("Requester") && r.RequesterId == userId) ||

                    // یک طراح فقط درخواست‌های تخصیص داده شده به خودش را می‌بیند
                    (userRoles.Contains("Designer") && r.DesignerId == userId) ||

                    // یک تاییدکننده فقط درخواست‌هایی را می‌بیند که منتظر تایید او هستند
                    (userRoles.Contains("Approver") && r.ApproverId == userId && r.Status == Core.Enums.RequestStatus.PendingApproval)
                );
            }

            // --- 4. اعمال فیلترهای ورودی (وضعیت و جستجو) ---
            // این فیلترها بعد از فیلتر امنیتی اعمال می‌شوند.
            if (statuses != null && statuses.Length > 0)
            {
                query = query.Where(r => statuses.Contains((int)r.Status));
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(r => r.Title.Contains(searchTerm));
            }

            // --- 5. اعمال مرتب‌سازی ---
            if (userRoles.Contains("Designer"))
            {
                // برای طراح: بر اساس نزدیک‌ترین تاریخ تحویل
                query = query.OrderBy(r => r.DueDate);
            }
            else
            {
                // برای سایرین: بر اساس جدیدترین درخواست ثبت شده
                query = query.OrderByDescending(r => r.SubmissionDate);
            }

            // --- 6. انتخاب فیلدهای نهایی و اجرای کوئری ---
            var requests = await query
                .Include(r => r.Requester) // Include برای دسترسی به نام درخواست‌دهنده لازم است
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
                    r.DueDate
                })
                .ToListAsync();

            return Ok(requests);
        }

        // POST: api/Requests
        [Authorize(Roles = "Requester")]
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromForm] CreateRequestDto requestDto, List<IFormFile> files)
        {
            var requesterId = User.FindFirstValue("id");
            var requestTypeItem = await _context.LookupItems.FindAsync(requestDto.RequestTypeId);
            if (requestTypeItem == null)
            {
                return BadRequest("Invalid Request Type ID.");
            }
            if (string.IsNullOrEmpty(requesterId))
            {
                return Unauthorized();
            }

            if (requestDto.DueDate.HasValue)
            {
                var settings = await _context.SystemSettings.ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);
                var dateToCheck = requestDto.DueDate.Value.Date;

                var requestCountForDay = await _context.Requests
                    .CountAsync(r => r.DueDate.HasValue && r.DueDate.Value.Date == dateToCheck && r.Priority == requestDto.Priority);

                if (requestDto.Priority == RequestPriority.Normal)
                {
                    var maxNormal = int.Parse(settings.GetValueOrDefault("MaxNormalRequestsPerDay", "5"));
                    if (requestCountForDay >= maxNormal)
                    {
                        return BadRequest("ظرفیت ثبت درخواست عادی برای این روز تکمیل شده است.");
                    }
                }
                else if (requestDto.Priority == RequestPriority.Urgent)
                {
                    var maxUrgent = int.Parse(settings.GetValueOrDefault("MaxUrgentRequestsPerDay", "2"));
                    if (requestCountForDay >= maxUrgent)
                    {
                        return BadRequest("ظرفیت ثبت درخواست فوری برای این روز تکمیل شده است.");
                    }
                }
            }

            // Start a transaction to ensure both tables are updated successfully
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                //var requestTypeItem = await _context.LookupItems.FindAsync(requestDto.RequestTypeId);
                if (requestTypeItem == null)
                {
                    return BadRequest("Invalid Request Type ID.");
                }

                var defaultDesignerId = (await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.SettingKey == "DefaultDesignerId"))?.SettingValue;

                if (string.IsNullOrEmpty(defaultDesignerId))
                {
                    return StatusCode(500, "Default designer is not configured in system settings.");
                }


                // 1. Create and save the main Request object
                var newRequest = new Request
                {
                    Title = requestDto.Title,
                    RequestTypeId = requestDto.RequestTypeId,
                    Priority = requestDto.Priority,
                    RequesterId = requesterId,
                    DueDate = requestDto.DueDate,

                    Status = RequestStatus.DesignerReview,
                    DesignerId = defaultDesignerId,
                    SubmissionDate = DateTime.UtcNow
                };
                await _context.Requests.AddAsync(newRequest);
                await _context.SaveChangesAsync();

                var historyMessage = HistoryMessageHelper.GetSystemMessageForStatusChange(RequestStatus.DesignerReview);
                var historyLog = new RequestHistory
                {
                    RequestId = newRequest.Id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = requesterId,
                    PreviousStatus = RequestStatus.Submitted, // وضعیت اولیه
                    NewStatus = newRequest.Status,
                    Comment = $"یادداشت سیستمی: {historyMessage}"
                };
                await _context.RequestHistories.AddAsync(historyLog);
                await _context.SaveChangesAsync();



                if (files != null && files.Count > 0)
                {
                    // پوشه آپلود را مشخص می‌کنیم (مثلا wwwroot/uploads)
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadPath))
                    {
                        Directory.CreateDirectory(uploadPath);
                    }

                    foreach (var file in files)
                    {
                        var storedFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadPath, storedFileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        var attachment = new Attachment
                        {
                            RequestId = newRequest.Id,
                            RequestHistoryId = historyLog.Id,
                            OriginalFileName = file.FileName,
                            StoredFileName = storedFileName,
                            FilePath = filePath,
                            ContentType = file.ContentType,
                            FileSize = file.Length,
                            UploadDate = DateTime.UtcNow
                        };
                        await _context.Attachments.AddAsync(attachment);
                    }

                }


                var strategy = _strategyFactory.GetStrategy(requestTypeItem.Value);

                await strategy.ProcessDetailsAsync(newRequest, requestDto, _context);


                await _context.SaveChangesAsync();

                // If everything is successful, commit the transaction
                await transaction.CommitAsync();

                // Send notification to the default designer
                if (!string.IsNullOrEmpty(defaultDesignerId))
                {
                    await _notificationService.CreateNotificationAsync(
                        defaultDesignerId,
                        newRequest.Id,
                        $"درخواست جدیدی ثبت شد: {newRequest.Title}",
                        "NewRequest"
                    );
                }

                return Ok(newRequest);
            }
            catch (Exception)
            {
                // If any error occurs, the transaction will be rolled back automatically
                // You might want to log the exception here
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // PATCH: api/Requests/{id}/assign
        [HttpPatch("{id}/assign")]
        public async Task<IActionResult> AssignDesigner(int id, [FromBody] AssignDesignerDto assignDto)
        {
            // 1. Find the request in the database
            var request = await _context.Requests.FindAsync(id);

            if (request == null)
            {
                return NotFound($"Request with ID {id} not found.");
            }

            // 2. Validate the current status of the request
            if (request.Status != Core.Enums.RequestStatus.Submitted)
            {
                return BadRequest("This request cannot be assigned as it's not in the 'Submitted' status.");
            }

            // 3. Update the request properties
            request.DesignerId = assignDto.DesignerId;
            request.Status = Core.Enums.RequestStatus.DesignInProgress;

            // 4. Save the changes
            await _context.SaveChangesAsync();

            // 5. Send notification to the designer
            await _notificationService.CreateNotificationAsync(
                assignDto.DesignerId,
                id,
                $"یک درخواست جدید به شما تخصیص داده شد: {request.Title}",
                "Assignment"
            );

            return Ok(request);
        }

        // PATCH: api/Requests/{id}/return
        [HttpPatch("{id}/return")]
        public async Task<IActionResult> ReturnForCorrection(int id, [FromForm] ReturnRequestDto returnDto, List<IFormFile> files)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.Requests.FindAsync(id);

                if (request == null)
                {
                    return NotFound();
                }

                if (request.Status != Core.Enums.RequestStatus.DesignerReview && // <<-- افزودن این شرط
                    request.Status != Core.Enums.RequestStatus.DesignInProgress &&
                    request.Status != Core.Enums.RequestStatus.PendingRedesign)
                {
                    return BadRequest("This action is not valid for the current request status.");
                }

                var previousStatus = request.Status;
                var newStatus = Core.Enums.RequestStatus.PendingCorrection;

                // 1. Update the request status
                request.Status = newStatus;

                var finalComment = returnDto.Comment;
                if (string.IsNullOrWhiteSpace(finalComment))
                {
                    finalComment = $"یادداشت سیستمی: {HistoryMessageHelper.GetSystemMessageForStatusChange(newStatus)}";
                }

                var historyLog = new RequestHistory
                {
                    RequestId = id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = returnDto.ActorId,
                    PreviousStatus = previousStatus,
                    NewStatus = newStatus,
                    Comment = finalComment
                };
                await _context.RequestHistories.AddAsync(historyLog);
                await _context.SaveChangesAsync();


                if (files != null && files.Count > 0)
                {
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                    foreach (var file in files)
                    {
                        var storedFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadPath, storedFileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        var attachment = new Attachment
                        {
                            RequestId = id,
                            RequestHistoryId = historyLog.Id,
                            OriginalFileName = file.FileName,
                            StoredFileName = storedFileName,
                            FilePath = filePath,
                            ContentType = file.ContentType,
                            FileSize = file.Length,
                            UploadDate = DateTime.UtcNow
                        };
                        await _context.Attachments.AddAsync(attachment);
                    }
                }



                // 3. Save all changes
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 4. Send notification to the requester
                if (!string.IsNullOrEmpty(request.RequesterId))
                {
                    await _notificationService.CreateNotificationAsync(
                        request.RequesterId,
                        id,
                        $"درخواست شما نیاز به اصلاح دارد: {request.Title}",
                        "ReturnForCorrection"
                    );
                }

                return Ok(request);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // PATCH: api/Requests/{id}/complete-design
        [HttpPatch("{id}/complete-design")]
        public async Task<IActionResult> CompleteDesign(int id, [FromForm] CompleteDesignDto completeDto, List<IFormFile> files)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.Requests.FindAsync(id);
                if (request == null)
                {
                    return NotFound();
                }

                if (request.Status != Core.Enums.RequestStatus.DesignInProgress && request.Status != Core.Enums.RequestStatus.PendingRedesign)
                {
                    return BadRequest("This action is not valid for the current request status.");
                }

                var previousStatus = request.Status;
                Core.Enums.RequestStatus newStatus;

                if (completeDto.NeedsApproval)
                {
                    if (string.IsNullOrEmpty(completeDto.ApproverId))
                    {
                        return BadRequest("ApproverId is required when the request needs approval.");
                    }
                    newStatus = Core.Enums.RequestStatus.PendingApproval;
                    request.ApproverId = completeDto.ApproverId;
                }
                else
                {
                    newStatus = Core.Enums.RequestStatus.Completed;
                    request.CompletionDate = DateTime.UtcNow; // Set completion date
                }

                // Update request status
                request.Status = newStatus;

                var finalComment = completeDto.Comment;
                if (string.IsNullOrWhiteSpace(finalComment))
                {
                    finalComment = $"یادداشت سیستمی: {HistoryMessageHelper.GetSystemMessageForStatusChange(newStatus)}";
                }
                // Create a history log entry
                var historyLog = new RequestHistory
                {
                    RequestId = id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = completeDto.ActorId,
                    PreviousStatus = previousStatus,
                    NewStatus = newStatus,
                    Comment = finalComment
                };
                await _context.RequestHistories.AddAsync(historyLog);

                await _context.RequestHistories.AddAsync(historyLog);
                await _context.SaveChangesAsync();


                if (files != null && files.Count > 0)
                {
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                    foreach (var file in files)
                    {
                        var storedFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadPath, storedFileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        var attachment = new Attachment
                        {
                            RequestId = id,
                            RequestHistoryId = historyLog.Id,
                            OriginalFileName = file.FileName,
                            StoredFileName = storedFileName,
                            FilePath = filePath,
                            ContentType = file.ContentType,
                            FileSize = file.Length,
                            UploadDate = DateTime.UtcNow
                        };
                        await _context.Attachments.AddAsync(attachment);
                    }
                }




                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Send notification based on status
                if (newStatus == Core.Enums.RequestStatus.PendingApproval && !string.IsNullOrEmpty(request.ApproverId))
                {
                    await _notificationService.CreateNotificationAsync(
                        request.ApproverId,
                        id,
                        $"درخواست جدیدی منتظر تایید شماست: {request.Title}",
                        "PendingApproval"
                    );
                }
                else if (newStatus == Core.Enums.RequestStatus.Completed && !string.IsNullOrEmpty(request.RequesterId))
                {
                    await _notificationService.CreateNotificationAsync(
                        request.RequesterId,
                        id,
                        $"درخواست شما تکمیل شد: {request.Title}",
                        "Completed"
                    );
                }

                return Ok(request);
            }
            catch (Exception)
            {
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // PATCH: api/Requests/{id}/process-approval
        [HttpPatch("{id}/process-approval")]
        public async Task<IActionResult> ProcessApproval(int id, [FromForm] ProcessApprovalDto approvalDto, List<IFormFile> files)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.Requests.FindAsync(id);
                if (request == null)
                {
                    return NotFound();
                }

                if (request.Status != Core.Enums.RequestStatus.PendingApproval)
                {
                    return BadRequest("This action can only be performed on a request that is pending approval.");
                }

                if (request.ApproverId != approvalDto.ActorId)
                {
                    return Unauthorized("You are not authorized to process this request.");
                }

                var previousStatus = request.Status;
                Core.Enums.RequestStatus newStatus;

                if (approvalDto.IsApproved)
                {
                    newStatus = Core.Enums.RequestStatus.Completed;
                    request.CompletionDate = DateTime.UtcNow;
                }
                else
                {
                    newStatus = Core.Enums.RequestStatus.PendingRedesign;
                }

                request.Status = newStatus;

                var finalComment = approvalDto.Comment;
                if (string.IsNullOrWhiteSpace(finalComment))
                {
                    finalComment = $"یادداشت سیستمی: {HistoryMessageHelper.GetSystemMessageForStatusChange(newStatus)}";
                }

                var historyLog = new RequestHistory
                {
                    RequestId = id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = approvalDto.ActorId,
                    PreviousStatus = previousStatus,
                    NewStatus = newStatus,
                    Comment = finalComment
                };
                await _context.RequestHistories.AddAsync(historyLog);
                await _context.SaveChangesAsync();

                if (files != null && files.Count > 0)
                {
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                    foreach (var file in files)
                    {
                        var storedFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadPath, storedFileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        var attachment = new Attachment
                        {
                            RequestId = id,
                            RequestHistoryId = historyLog.Id,
                            OriginalFileName = file.FileName,
                            StoredFileName = storedFileName,
                            FilePath = filePath,
                            ContentType = file.ContentType,
                            FileSize = file.Length,
                            UploadDate = DateTime.UtcNow
                        };
                        await _context.Attachments.AddAsync(attachment);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Send notification based on approval decision
                if (approvalDto.IsApproved)
                {
                    // Always notify the requester
                    if (!string.IsNullOrEmpty(request.RequesterId))
                    {
                        await _notificationService.CreateNotificationAsync(
                            request.RequesterId,
                            id,
                            $"درخواست شما تایید و تکمیل شد: {request.Title}",
                            "Approved"
                        );
                    }

                    // Also notify the designer if approver is someone else
                    if (!string.IsNullOrEmpty(request.DesignerId) &&
                        request.DesignerId != approvalDto.ActorId)
                    {
                        await _notificationService.CreateNotificationAsync(
                            request.DesignerId,
                            id,
                            $"درخواست تایید شد: {request.Title}",
                            "Approved"
                        );
                    }
                }
                else if (!approvalDto.IsApproved)
                {
                    // Notify designer for redesign
                    if (!string.IsNullOrEmpty(request.DesignerId))
                    {
                        await _notificationService.CreateNotificationAsync(
                            request.DesignerId,
                            id,
                            $"درخواست نیاز به طراحی مجدد دارد: {request.Title}",
                            "Redesign"
                        );
                    }
                }

                return Ok(request);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // GET: api/Requests/{id}/comments
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetRequestComments(int id)
        {
            var comments = await _context.Comments
                .Where(c => c.RequestId == id)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAt,
                    Author = c.Author.UserName
                })
                .ToListAsync();

            return Ok(comments);
        }

        // POST: api/Requests/{id}/comments
        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto commentDto)
        {
            var authorId = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(authorId))
            {
                return Unauthorized();
            }

            if (!await _context.Requests.AnyAsync(r => r.Id == id))
            {
                return NotFound("Request not found.");
            }

            var comment = new Comment
            {
                Content = commentDto.Content,
                RequestId = id,
                AuthorId = authorId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Comments.AddAsync(comment);
            await _context.SaveChangesAsync();

            // Get the request to determine who should receive the notification
            var request = await _context.Requests
                .Include(r => r.Requester)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request != null)
            {
                // Notify all relevant parties except the comment author
                var notifyUserIds = new List<string>();

                if (!string.IsNullOrEmpty(request.RequesterId) && request.RequesterId != authorId)
                    notifyUserIds.Add(request.RequesterId);

                if (!string.IsNullOrEmpty(request.DesignerId) && request.DesignerId != authorId)
                    notifyUserIds.Add(request.DesignerId);

                if (!string.IsNullOrEmpty(request.ApproverId) && request.ApproverId != authorId)
                    notifyUserIds.Add(request.ApproverId);

                // Send notifications to all relevant parties
                foreach (var userId in notifyUserIds.Distinct())
                {
                    await _notificationService.CreateNotificationAsync(
                        userId,
                        id,
                        $"نظر جدیدی به درخواست اضافه شد: {request.Title}",
                        "Comment"
                    );
                }
            }

            return Ok(comment);
        }

        // GET: api/Requests/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequestById(int id)
        {
            var request = await _context.Requests
                .Include(r => r.Requester)
                .Include(r => r.Designer)
                .Include(r => r.Approver)
                .Include(r => r.RequestType) // واکشی نوع درخواست برای دسترسی به نام آن
                .AsNoTracking() // برای بهینه‌سازی و افزایش سرعت خواندن
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                return NotFound();
            }

            var attachments = await _context.Attachments
                .Where(a => a.RequestId == id)
                .Select(a => new { a.Id, a.OriginalFileName, a.StoredFileName, a.RequestHistoryId }) // فقط اطلاعات لازم
                .ToListAsync();

            var histories = await _context.RequestHistories
                .Include(h => h.Actor) // واکشی اطلاعات کاربری که اقدام را انجام داده
               .Where(h => h.RequestId == id)
               .OrderByDescending(h => h.ActionDate)
               .Select(h => new
               {
                   h.Id,
                   h.Comment,
                   h.ActionDate,
                   ActorName = (h.Actor.FirstName + " " + h.Actor.LastName).Trim() != ""
                    ? h.Actor.FirstName + " " + h.Actor.LastName
                    : h.Actor.UserName,
                   h.PreviousStatus,
                   h.NewStatus
               })
               .ToListAsync();

            // اتصال فایل‌ها به تاریخچه مربوطه
            var historiesWithAttachments = histories.Select(h => new
            {
                h.Id,
                h.Comment,
                h.ActionDate,
                h.ActorName,
                h.PreviousStatus,
                h.NewStatus,
                Attachments = attachments.Where(a => a.RequestHistoryId == h.Id).ToList()
            }).ToList();

            object? details = null;
            switch (request.RequestType.Value)
            {
                case "طراحی لیبل":
                    details = await _context.LabelRequestDetails.FindAsync(id);
                    break;
                case "عکس بسته‌بندی محصولات":
                    details = await _context.PackagingPhotoDetails.FindAsync(id);
                    break;
                case "پست اینستاگرام":
                    details = await _context.InstagramPostDetails.FindAsync(id);
                    break;
                case "ویدئو تبلیغاتی":
                    details = await _context.PromotionalVideoDetails.FindAsync(id);
                    break;
                case "محتوا برای سایت":
                    details = await _context.WebsiteContentDetails.FindAsync(id);
                    break;
                case "ویرایش فایل":
                    details = await _context.FileEditDetails.FindAsync(id);
                    break;
                case "کالای تبلیغاتی":
                    details = await _context.PromotionalItemDetails.FindAsync(id);
                    break;
                case "تبلیغات بصری":
                    details = await _context.VisualAdDetails.FindAsync(id);
                    break;
                case "تبلیغات محیطی":
                    details = await _context.EnvironmentalAdDetails.FindAsync(id);
                    break;
                case "متفرقه":
                    details = await _context.MiscellaneousDetails.FindAsync(id);
                    break;
            }

            var result = new
            {
                request.Id,
                request.Title,
                request.Status,
                request.Priority,

                // --- بخش اصلاح شده ---
                RequesterName = (request.Requester.FirstName + " " + request.Requester.LastName).Trim() != ""
                    ? request.Requester.FirstName + " " + request.Requester.LastName
                    : request.Requester.UserName,
                RequesterUsername = request.Requester.UserName,
                DesignerName = request.Designer != null
                    ? ((request.Designer.FirstName + " " + request.Designer.LastName).Trim() != "" ? request.Designer.FirstName + " " + request.Designer.LastName : request.Designer.UserName)
                    : null,
                DesignerUsername = request.Designer?.UserName,
                ApproverName = request.Approver != null
                    ? ((request.Approver.FirstName + " " + request.Approver.LastName).Trim() != "" ? request.Approver.FirstName + " " + request.Approver.LastName : request.Approver.UserName)
                    : null,
                ApproverUsername = request.Approver?.UserName,

                // ID ها را هم اضافه می‌کنیم
                request.RequesterId,
                request.DesignerId,
                request.ApproverId,
                // --- پایان بخش اصلاح شده ---

                request.DueDate,
                request.SubmissionDate,
                request.CompletionDate,

                RequestTypeName = request.RequestType.Value, // نام فارسی نوع درخواست
                Details = details, // آبجکت جزئیات اختصاصی
                Attachments = attachments, // لیست پیوست‌ها

                Histories = historiesWithAttachments
            };

            return Ok(result);
        }

        // PATCH: api/Requests/{id}/resubmit
        [HttpPatch("{id}/resubmit")]
        public async Task<IActionResult> ResubmitRequest(int id)
        {
            var request = await _context.Requests.FindAsync(id);
            if (request == null) return NotFound();

            // این عملیات فقط برای درخواست‌های برگشت خورده مجاز است
            if (request.Status != RequestStatus.PendingCorrection)
            {
                return BadRequest("This request cannot be resubmitted.");
            }

            var newStatus = RequestStatus.DesignerReview;

            var previousStatus = request.Status;
            request.Status = newStatus;

            // ثبت در تاریخچه
            var historyLog = new RequestHistory
            {
                RequestId = id,
                ActionDate = DateTime.UtcNow,
                ActorId = request.RequesterId,
                PreviousStatus = previousStatus,
                NewStatus = request.Status,
                Comment = "درخواست پس از اصلاحات، مجدداً برای طراح ارسال شد."
            };
            await _context.RequestHistories.AddAsync(historyLog);
            await _context.SaveChangesAsync();

            // Send notification to the designer
            if (!string.IsNullOrEmpty(request.DesignerId))
            {
                await _notificationService.CreateNotificationAsync(
                    request.DesignerId,
                    id,
                    $"درخواست پس از اصلاح توسط درخواست‌دهنده ارسال شد: {request.Title}",
                    "Resubmit"
                );
            }

            return Ok(request);
        }

        // PATCH: api/Requests/{id}/resubmit-for-approval
        [HttpPatch("{id}/resubmit-for-approval")]
        public async Task<IActionResult> ResubmitForApproval(int id)
        {
            var request = await _context.Requests.FindAsync(id);
            if (request == null) return NotFound();

            // این عملیات فقط برای درخواست‌هایی که نیاز به طراحی مجدد دارند مجاز است
            if (request.Status != RequestStatus.PendingRedesign)
            {
                return BadRequest("This request cannot be resubmitted for approval.");
            }

            // TODO: می‌توانیم چک کنیم که فقط خود طراح این کار را انجام دهد

            var previousStatus = request.Status;
            var newStatus = RequestStatus.PendingApproval; // مستقیماً به صف تایید برمی‌گردد

            request.Status = newStatus;

            var historyLog = new RequestHistory
            {
                RequestId = id,
                ActionDate = DateTime.UtcNow,
                ActorId = request.DesignerId, // اقدام توسط طراح
                PreviousStatus = previousStatus,
                NewStatus = newStatus,
                Comment = "طراحی پس از اصلاحات، مجدداً برای تایید ارسال شد."
            };
            await _context.RequestHistories.AddAsync(historyLog);
            await _context.SaveChangesAsync();

            // Send notification to the approver
            if (!string.IsNullOrEmpty(request.ApproverId))
            {
                await _notificationService.CreateNotificationAsync(
                    request.ApproverId,
                    id,
                    $"درخواست پس از طراحی مجدد، منتظر تایید شماست: {request.Title}",
                    "ResubmitForApproval"
                );
            }

            return Ok(request);
        }

        // PUT: api/Requests/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRequest(int id, [FromForm] CreateRequestDto updateDto, List<IFormFile> files)
        {
            var requesterId = User.FindFirstValue("id");
            var request = await _context.Requests.Include(r => r.RequestType).FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound();
            if (request.RequesterId != requesterId) return Forbid();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // به‌روزرسانی فیلدهای عمومی
                request.Title = updateDto.Title;
                request.Priority = updateDto.Priority;
                request.DueDate = updateDto.DueDate;

                // به‌روزرسانی جزئیات اختصاصی
                var strategy = _strategyFactory.GetStrategy(request.RequestType.Value);
                await strategy.UpdateDetailsAsync(request, updateDto, _context);

                // --- منطق کامل مدیریت فایل‌های پیوست ---

                // ۱. حذف فایل‌های قدیمی که دیگر مورد نیاز نیستند
                var currentAttachments = await _context.Attachments.Where(a => a.RequestId == id).ToListAsync();
                var attachmentsToDelete = currentAttachments.Where(a => !(updateDto.ExistingAttachmentIds?.Contains(a.Id) ?? false)).ToList();

                foreach (var attachment in attachmentsToDelete)
                {
                    try
                    {
                        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", attachment.StoredFileName);
                        if (System.IO.File.Exists(filePath))
                        {
                            System.IO.File.Delete(filePath);
                        }
                    }
                    catch (Exception ex)
                    {
                        // لاگ کردن خطا در حذف فایل فیزیکی، اما ادامه عملیات
                        Console.WriteLine($"Error deleting file {attachment.StoredFileName}: {ex.Message}");
                    }
                }
                _context.Attachments.RemoveRange(attachmentsToDelete);

                var historyLog = new RequestHistory
                {
                    RequestId = id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = requesterId,
                    PreviousStatus = request.Status, // وضعیت تغییر نمی‌کند
                    NewStatus = request.Status,
                    Comment = "درخواست توسط ثبت کننده ویرایش شد."
                };
                await _context.RequestHistories.AddAsync(historyLog);
                await _context.SaveChangesAsync();


                // ۲. افزودن فایل‌های جدید
                if (files != null && files.Count > 0)
                {
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                    foreach (var file in files)
                    {
                        var storedFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadPath, storedFileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        var newAttachment = new Attachment
                        {
                            RequestId = id,
                            RequestHistoryId = historyLog.Id,
                            OriginalFileName = file.FileName,
                            StoredFileName = storedFileName,
                            FilePath = filePath,
                            ContentType = file.ContentType,
                            FileSize = file.Length,
                            UploadDate = DateTime.UtcNow
                        };
                        await _context.Attachments.AddAsync(newAttachment);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(request);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"An internal error occurred: {ex.Message}");
            }
        }

        // PATCH: api/Requests/{id}/start-design
        [HttpPatch("{id}/start-design")]
        [Authorize(Roles = "Designer")]
        public async Task<IActionResult> StartDesign(int id)
        {
            var request = await _context.Requests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            if (request.Status != Core.Enums.RequestStatus.DesignerReview)
            {
                return BadRequest("This action is not valid for the current request status.");
            }

            var designerId = User.FindFirstValue("id");
            if (request.DesignerId != designerId)
            {
                return Forbid("You are not assigned to this request.");
            }

            var previousStatus = request.Status;
            request.Status = Core.Enums.RequestStatus.DesignInProgress;

            var historyMessage = HistoryMessageHelper.GetSystemMessageForStatusChange(request.Status);
            var historyLog = new RequestHistory
            {
                RequestId = id,
                ActionDate = DateTime.UtcNow,
                ActorId = designerId,
                PreviousStatus = previousStatus,
                NewStatus = request.Status,
                Comment = $"یادداشت سیستمی: {historyMessage}"
            };

            await _context.RequestHistories.AddAsync(historyLog);
            await _context.SaveChangesAsync();

            return Ok(request);
        }
    }
}
