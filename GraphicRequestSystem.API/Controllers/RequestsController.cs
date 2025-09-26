using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Enums;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Controllers
{
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
        [HttpPost]
        public async Task<IActionResult> CreateRequest(CreateRequestDto requestDto)
        {
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
                    RequesterId = requestDto.RequesterId,
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
    }
}
