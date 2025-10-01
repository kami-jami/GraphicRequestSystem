
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Enums;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Controllers
{
    [Authorize(Roles = "Admin")] // فقط کاربران با نقش Admin به این کنترلر دسترسی دارند
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly AppDbContext _context;


        public AdminController(UserManager<AppUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET: api/Admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsersWithRoles()
        {
            var users = await _userManager.Users
                .Select(user => new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName,
                    Email = user.Email
                })
                .ToListAsync();

            foreach (var userDto in users)
            {
                var user = await _userManager.FindByIdAsync(userDto.Id);
                userDto.Roles = await _userManager.GetRolesAsync(user);
            }

            return Ok(users);
        }

        // POST: api/Admin/users/{id}/roles
        [HttpPost("users/{id}/roles")]
        public async Task<IActionResult> UpdateUserRoles(string id, [FromBody] UpdateUserRolesDto updateDto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            var result = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!result.Succeeded)
            {
                return BadRequest("Failed to remove existing roles.");
            }

            result = await _userManager.AddToRolesAsync(user, updateDto.Roles);
            if (!result.Succeeded)
            {
                return BadRequest("Failed to add new roles.");
            }

            return Ok(await _userManager.GetRolesAsync(user));
        }

        // GET: api/Admin/settings
        [HttpGet("settings")]
        public async Task<IActionResult> GetSystemSettings()
        {
            var settings = await _context.SystemSettings
                .Select(s => new SystemSettingDto
                {
                    SettingKey = s.SettingKey,
                    SettingValue = s.SettingValue
                })
                .ToListAsync();
            return Ok(settings);
        }

        // PUT: api/Admin/settings
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSystemSettings([FromBody] List<SystemSettingDto> settingsDto)
        {
            var allSettings = await _context.SystemSettings.ToListAsync();

            foreach (var settingDto in settingsDto)
            {
                var settingToUpdate = allSettings.FirstOrDefault(s => s.SettingKey == settingDto.SettingKey);
                if (settingToUpdate != null)
                {
                    settingToUpdate.SettingValue = settingDto.SettingValue;
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Settings updated successfully.");
        }

        // GET: api/Admin/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var dashboardDto = new AdminDashboardDto();

            // 1. Get total user count
            dashboardDto.TotalUsers = await _userManager.Users.CountAsync();

            // 2. Get request stats
            var allRequests = await _context.Requests.ToListAsync();

            dashboardDto.TotalRequests = allRequests.Count;

            var nonCompletedStatuses = new[] {
                RequestStatus.Submitted, RequestStatus.DesignerReview, RequestStatus.PendingCorrection,
                RequestStatus.DesignInProgress, RequestStatus.PendingApproval, RequestStatus.PendingRedesign
            };

            dashboardDto.PendingRequests = allRequests.Count(r => nonCompletedStatuses.Contains(r.Status));

            dashboardDto.OverdueRequests = allRequests.Count(r => nonCompletedStatuses.Contains(r.Status) && r.DueDate < DateTime.UtcNow);

            // 3. Get request counts by status
            dashboardDto.RequestsByStatus = allRequests
                .GroupBy(r => r.Status)
                .Select(g => new StatusCountDto
                {
                    Status = g.Key,
                    StatusName = g.Key.ToString(),
                    Count = g.Count()
                })
                .ToList();

            return Ok(dashboardDto);
        }


        // GET: api/Admin/lookups
        [HttpGet("lookups")]
        public async Task<IActionResult> GetLookupLists()
        {
            return Ok(await _context.Lookups.Select(l => l.Name).ToListAsync());
        }

        // GET: api/Admin/lookups/{listName}
        [HttpGet("lookups/{listName}")]
        public async Task<IActionResult> GetLookupItems(string listName)
        {
            var items = await _context.LookupItems
                .Include(i => i.Lookup)
                .Where(i => i.Lookup.Name.ToLower() == listName.ToLower())
                .Select(i => new { i.Id, i.Value })
                .ToListAsync();

            return Ok(items);
        }
    }
}