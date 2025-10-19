using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GraphicRequestSystem.API.Controllers
{
    /// <summary>
    /// Controller for managing designer's private notes.
    /// SECURITY: Only designers can access their own notes.
    /// Other roles (Requester, Approver, Admin) have NO access to these notes.
    /// </summary>
    [Authorize(Roles = "Designer")]
    [Route("api/[controller]")]
    [ApiController]
    public class DesignerNotesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;

        public DesignerNotesController(AppDbContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /// <summary>
        /// Get all notes for a specific request created by the current designer.
        /// Only returns notes created by the authenticated designer.
        /// </summary>
        /// <param name="requestId">The request ID to get notes for</param>
        /// <returns>List of designer notes</returns>
        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetNotesForRequest(int requestId)
        {
            var designerId = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(designerId))
            {
                return Unauthorized();
            }

            // Verify the request exists and the designer has access to it
            var request = await _context.Requests.FindAsync(requestId);
            if (request == null)
            {
                return NotFound(new { message = "Request not found." });
            }

            // SECURITY: Only allow access if the designer is assigned to this request
            if (request.DesignerId != designerId)
            {
                return Forbid(); // Designer not assigned to this request
            }

            var notes = await _context.DesignerNotes
                .Include(dn => dn.Designer)
                .Where(dn => dn.RequestId == requestId &&
                             dn.DesignerId == designerId &&
                             !dn.IsDeleted)
                .OrderByDescending(dn => dn.CreatedAt)
                .Select(dn => new DesignerNoteDto
                {
                    Id = dn.Id,
                    RequestId = dn.RequestId,
                    DesignerId = dn.DesignerId,
                    DesignerName = dn.Designer.FirstName + " " + dn.Designer.LastName,
                    NoteText = dn.NoteText,
                    CreatedAt = dn.CreatedAt,
                    UpdatedAt = dn.UpdatedAt
                })
                .ToListAsync();

            return Ok(notes);
        }

        /// <summary>
        /// Get a specific note by ID.
        /// Only accessible if the note was created by the authenticated designer.
        /// </summary>
        /// <param name="id">Note ID</param>
        /// <returns>Designer note</returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetNoteById(int id)
        {
            var designerId = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(designerId))
            {
                return Unauthorized();
            }

            var note = await _context.DesignerNotes
                .Include(dn => dn.Designer)
                .Where(dn => dn.Id == id && dn.DesignerId == designerId && !dn.IsDeleted)
                .Select(dn => new DesignerNoteDto
                {
                    Id = dn.Id,
                    RequestId = dn.RequestId,
                    DesignerId = dn.DesignerId,
                    DesignerName = dn.Designer.FirstName + " " + dn.Designer.LastName,
                    NoteText = dn.NoteText,
                    CreatedAt = dn.CreatedAt,
                    UpdatedAt = dn.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (note == null)
            {
                return NotFound(new { message = "Note not found or you don't have access to it." });
            }

            return Ok(note);
        }

        /// <summary>
        /// Create a new private note for a request.
        /// Only the designer assigned to the request can create notes.
        /// </summary>
        /// <param name="requestId">Request ID</param>
        /// <param name="createDto">Note data</param>
        /// <returns>Created note</returns>
        [HttpPost("request/{requestId}")]
        public async Task<IActionResult> CreateNote(int requestId, [FromBody] CreateDesignerNoteDto createDto)
        {
            var designerId = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(designerId))
            {
                return Unauthorized();
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(createDto.NoteText))
            {
                return BadRequest(new { message = "Note text cannot be empty." });
            }

            if (createDto.NoteText.Length > 5000)
            {
                return BadRequest(new { message = "Note text cannot exceed 5000 characters." });
            }

            // Verify the request exists and the designer has access
            var request = await _context.Requests.FindAsync(requestId);
            if (request == null)
            {
                return NotFound(new { message = "Request not found." });
            }

            // SECURITY: Only allow if designer is assigned to this request
            if (request.DesignerId != designerId)
            {
                return Forbid();
            }

            var note = new DesignerNote
            {
                RequestId = requestId,
                DesignerId = designerId,
                NoteText = createDto.NoteText.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.DesignerNotes.Add(note);
            await _context.SaveChangesAsync();

            var designer = await _userManager.FindByIdAsync(designerId);
            var noteDto = new DesignerNoteDto
            {
                Id = note.Id,
                RequestId = note.RequestId,
                DesignerId = note.DesignerId,
                DesignerName = designer?.FirstName + " " + designer?.LastName ?? "Unknown",
                NoteText = note.NoteText,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt
            };

            return CreatedAtAction(nameof(GetNoteById), new { id = note.Id }, noteDto);
        }

        /// <summary>
        /// Update an existing note.
        /// Only the designer who created the note can update it.
        /// </summary>
        /// <param name="id">Note ID</param>
        /// <param name="updateDto">Updated note data</param>
        /// <returns>Updated note</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNote(int id, [FromBody] UpdateDesignerNoteDto updateDto)
        {
            var designerId = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(designerId))
            {
                return Unauthorized();
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(updateDto.NoteText))
            {
                return BadRequest(new { message = "Note text cannot be empty." });
            }

            if (updateDto.NoteText.Length > 5000)
            {
                return BadRequest(new { message = "Note text cannot exceed 5000 characters." });
            }

            var note = await _context.DesignerNotes.FindAsync(id);
            if (note == null || note.IsDeleted)
            {
                return NotFound(new { message = "Note not found." });
            }

            // SECURITY: Only the designer who created the note can update it
            if (note.DesignerId != designerId)
            {
                return Forbid();
            }

            note.NoteText = updateDto.NoteText.Trim();
            note.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var designer = await _userManager.FindByIdAsync(designerId);
            var noteDto = new DesignerNoteDto
            {
                Id = note.Id,
                RequestId = note.RequestId,
                DesignerId = note.DesignerId,
                DesignerName = designer?.FirstName + " " + designer?.LastName ?? "Unknown",
                NoteText = note.NoteText,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt
            };

            return Ok(noteDto);
        }

        /// <summary>
        /// Delete a note (soft delete).
        /// Only the designer who created the note can delete it.
        /// </summary>
        /// <param name="id">Note ID</param>
        /// <returns>Success message</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            var designerId = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(designerId))
            {
                return Unauthorized();
            }

            var note = await _context.DesignerNotes.FindAsync(id);
            if (note == null || note.IsDeleted)
            {
                return NotFound(new { message = "Note not found." });
            }

            // SECURITY: Only the designer who created the note can delete it
            if (note.DesignerId != designerId)
            {
                return Forbid();
            }

            // Soft delete
            note.IsDeleted = true;
            note.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Note deleted successfully." });
        }
    }
}
