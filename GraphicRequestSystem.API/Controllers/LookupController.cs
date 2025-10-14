using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Controllers
{
    [Authorize] 
    [Route("api/[controller]")]
    [ApiController]
    public class LookupController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        public LookupController(AppDbContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet] // GET: api/Lookup
        public async Task<IActionResult> GetLookupLists()
        {
            return Ok(await _context.Lookups
                .Select(l => new LookupDto { Id = l.Id, Name = l.Name })
                .ToListAsync());
        }

        [HttpGet("{lookupId}/items")] // GET: api/Lookup/{id}/items
        public async Task<IActionResult> GetLookupItems(int lookupId)
        {
            var items = await _context.LookupItems
                .Where(i => i.LookupId == lookupId)
                .Select(i => new { i.Id, i.Value })
                .ToListAsync();
            return Ok(items);
        }

        [HttpGet("designers")]
        public async Task<IActionResult> GetDesigners()
        {
            var designers = await _userManager.GetUsersInRoleAsync("Designer");
            var result = designers
                .Where(d => d.IsActive)
                .Select(d => new { 
                    d.Id, 
                    d.UserName, 
                    d.FirstName, 
                    d.LastName,
                    DesignerFullName = (d.FirstName + " " + d.LastName).Trim(),
                    FullName = (d.FirstName + " " + d.LastName).Trim() != "" ? d.FirstName + " " + d.LastName : d.UserName
                })
                .ToList();
            return Ok(result);
        }

        // GET: api/Admin/approvers
        [HttpGet("approvers")]
        public async Task<IActionResult> GetApprovers()
        {
            var approvers = await _userManager.GetUsersInRoleAsync("Approver");
            var result = approvers
                .Where(d => d.IsActive)
                .Select(d => new {
                    d.Id, 
                    d.UserName, 
                    d.FirstName, 
                    d.LastName,
                    ApproverFullName = (d.FirstName + " " + d.LastName).Trim(),
                })
                .ToList();
            return Ok(result);
        }
    }
}

