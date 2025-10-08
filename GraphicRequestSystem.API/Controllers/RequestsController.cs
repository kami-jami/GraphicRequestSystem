using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Enums;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Infrastructure.Strategies;

namespace GraphicRequestSystem.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly RequestDetailStrategyFactory _strategyFactory; 

        // ۲. سازنده را برای دریافت Factory اصلاح کنید
        public RequestsController(AppDbContext context, RequestDetailStrategyFactory strategyFactory)
        {
            _context = context;
            _strategyFactory = strategyFactory;
        }

        // GET: api/Requests
        [HttpGet]
        public async Task<IActionResult> GetRequests()
        {
            var requests = await _context.Requests
        .Include(r => r.Requester) 
        .Select(r => new {
            r.Id,
            r.Title,
            r.Status,
            r.Priority,
            RequesterName = r.Requester.UserName,
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

                    // درخواست به صورت خودکار تخصیص و وضعیت آن تغییر می‌کند
                    Status = RequestStatus.DesignInProgress,
                    DesignerId = defaultDesignerId,
                    SubmissionDate = DateTime.UtcNow
                };
                await _context.Requests.AddAsync(newRequest);
                await _context.SaveChangesAsync(); // Save to get the newRequest.Id


                var strategy = _strategyFactory.GetStrategy(requestTypeItem.Value);

                await strategy.ProcessDetailsAsync(newRequest, requestDto, _context);


                

                
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
                            OriginalFileName = file.FileName,
                            StoredFileName = storedFileName,
                            FilePath = filePath,
                            ContentType = file.ContentType,
                            FileSize = file.Length,
                            UploadDate = DateTime.UtcNow
                        };
                        await _context.Attachments.AddAsync(attachment);
                    }
                    await _context.SaveChangesAsync(); 
                }
                

                // If everything is successful, commit the transaction
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetRequests), new { id = newRequest.Id }, newRequest);
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

            return Ok(request);
        }

        // PATCH: api/Requests/{id}/return
        [HttpPatch("{id}/return")]
        public async Task<IActionResult> ReturnForCorrection(int id, [FromBody] ReturnRequestDto returnDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.Requests.FindAsync(id);

                if (request == null)
                {
                    return NotFound();
                }

                // A request can only be returned if a designer is working on it
                if (request.Status != Core.Enums.RequestStatus.DesignInProgress)
                {
                    return BadRequest("This request cannot be returned as it's not in progress.");
                }

                var previousStatus = request.Status;
                var newStatus = Core.Enums.RequestStatus.PendingCorrection;

                // 1. Update the request status
                request.Status = newStatus;

                // 2. Create a history log entry
                var historyLog = new RequestHistory
                {
                    RequestId = id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = returnDto.ActorId,
                    PreviousStatus = previousStatus,
                    NewStatus = newStatus,
                    Comment = returnDto.Comment
                };
                await _context.RequestHistories.AddAsync(historyLog);

                // 3. Save all changes
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(request);
            }
            catch (Exception)
            {
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // PATCH: api/Requests/{id}/complete-design
        [HttpPatch("{id}/complete-design")]
        public async Task<IActionResult> CompleteDesign(int id, [FromBody] CompleteDesignDto completeDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.Requests.FindAsync(id);
                if (request == null)
                {
                    return NotFound();
                }

                if (request.Status != Core.Enums.RequestStatus.DesignInProgress)
                {
                    return BadRequest("This action can only be performed on a request that is in progress.");
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

                // Create a history log entry
                var historyLog = new RequestHistory
                {
                    RequestId = id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = completeDto.ActorId,
                    PreviousStatus = previousStatus,
                    NewStatus = newStatus,
                    Comment = completeDto.Comment
                };
                await _context.RequestHistories.AddAsync(historyLog);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(request);
            }
            catch (Exception)
            {
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // PATCH: api/Requests/{id}/process-approval
        [HttpPatch("{id}/process-approval")]
        public async Task<IActionResult> ProcessApproval(int id, [FromBody] ProcessApprovalDto approvalDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.Requests.FindAsync(id);
                if (request == null)
                {
                    return NotFound();
                }

                // Action is only valid if the request is pending approval
                if (request.Status != Core.Enums.RequestStatus.PendingApproval)
                {
                    return BadRequest("This action can only be performed on a request that is pending approval.");
                }

                // Optional but recommended: Check if the actor is the designated approver
                if (request.ApproverId != approvalDto.ActorId)
                {
                    return Unauthorized("You are not authorized to process this request.");
                }

                var previousStatus = request.Status;
                Core.Enums.RequestStatus newStatus;

                if (approvalDto.IsApproved)
                {
                    newStatus = Core.Enums.RequestStatus.Completed;
                    request.CompletionDate = DateTime.UtcNow; // Set completion date on final approval
                }
                else
                {
                    if (string.IsNullOrEmpty(approvalDto.Comment))
                    {
                        return BadRequest("A comment is required when rejecting a design.");
                    }
                    newStatus = Core.Enums.RequestStatus.PendingRedesign;
                }

                // Update request status
                request.Status = newStatus;

                // Create a history log entry
                var historyLog = new RequestHistory
                {
                    RequestId = id,
                    ActionDate = DateTime.UtcNow,
                    ActorId = approvalDto.ActorId,
                    PreviousStatus = previousStatus,
                    NewStatus = newStatus,
                    Comment = approvalDto.Comment
                };
                await _context.RequestHistories.AddAsync(historyLog);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(request);
            }
            catch (Exception)
            {
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
                .Select(a => new { a.Id, a.OriginalFileName, a.StoredFileName }) // فقط اطلاعات لازم
                .ToListAsync();

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
                RequesterName = request.Requester.UserName,
                DesignerName = request.Designer?.UserName,
                ApproverName = request.Approver?.UserName,

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

            var newStatus = RequestStatus.DesignInProgress;

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
                Comment = "درخواست پس از اصلاحات، مجدداً برای طراح ارسال شد." // متن کامنت هم بهتر شد
            };
            await _context.RequestHistories.AddAsync(historyLog);
            await _context.SaveChangesAsync();

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

            return Ok(request);
        }
    }
}
