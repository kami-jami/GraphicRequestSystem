using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Enums;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace GraphicRequestSystem.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RequestsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Requests
        [HttpGet]
        public async Task<IActionResult> GetRequests()
        {
            var requests = await _context.Requests.ToListAsync();
            return Ok(requests);
        }

        // POST: api/Requests
        [Authorize(Roles = "Requester")]
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromForm] CreateRequestDto requestDto, List<IFormFile> files)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(requesterId))
            {
                return Unauthorized();
            }

            // Start a transaction to ensure both tables are updated successfully
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Create and save the main Request object
                var newRequest = new Request
                {
                    Title = requestDto.Title,
                    RequestTypeId = requestDto.RequestTypeId,
                    Priority = requestDto.Priority,
                    RequesterId = requesterId,
                    DueDate = requestDto.DueDate,
                    Status = RequestStatus.Submitted,
                    SubmissionDate = DateTime.UtcNow
                };
                await _context.Requests.AddAsync(newRequest);
                await _context.SaveChangesAsync(); // Save to get the newRequest.Id

                // 2. Check if it's a Label Request and save details if so
                // We assume ID 1 is "طراحی لیبل" based on our seed data
                if (requestDto.RequestTypeId == 1)
                {
                    if (requestDto.LabelDetails == null)
                    {
                        return BadRequest("Label details are required for this request type.");
                    }

                    var labelDetail = new LabelRequestDetail
                    {
                        RequestId = newRequest.Id, // Link to the main request
                        ProductNameFA = requestDto.LabelDetails.ProductNameFA,
                        ProductNameEN = requestDto.LabelDetails.ProductNameEN,
                        Brand = requestDto.LabelDetails.Brand,
                        LabelTypeId = requestDto.LabelDetails.LabelTypeId,
                        TechnicalSpecs = requestDto.LabelDetails.TechnicalSpecs,
                        Dimensions = requestDto.LabelDetails.Dimensions,
                        PrintQuantity = requestDto.LabelDetails.PrintQuantity,
                        MeasurementValue = requestDto.LabelDetails.MeasurementValue,
                        MeasurementUnitId = requestDto.LabelDetails.MeasurementUnitId
                    };
                    await _context.LabelRequestDetails.AddAsync(labelDetail);
                    await _context.SaveChangesAsync();
                }

                
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
    }
}
