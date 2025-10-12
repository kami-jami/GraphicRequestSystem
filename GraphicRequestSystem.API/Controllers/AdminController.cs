
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
            return Ok(new { message = "Settings updated successfully." });
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

        //// GET: api/Admin/lookups
        //[HttpGet("lookups")]
        //public async Task<IActionResult> GetLookupLists()
        //{
        //    return Ok(await _context.Lookups
        //        .Select(l => new LookupDto { Id = l.Id, Name = l.Name })
        //        .ToListAsync());
        //}

        //// GET: api/Admin/lookups/{lookupId}/items
        //[HttpGet("lookups/{lookupId}/items")]
        //public async Task<IActionResult> GetLookupItems(int lookupId)
        //{
        //    var items = await _context.LookupItems
        //        .Where(i => i.LookupId == lookupId)
        //        .Select(i => new { i.Id, i.Value })
        //        .ToListAsync();
        //    return Ok(items);
        //}

        // POST: api/Admin/lookups/{lookupId}/items
        [HttpPost("lookups/{lookupId}/items")]
        public async Task<IActionResult> AddLookupItem(int lookupId, [FromBody] CreateLookupItemDto dto)
        {
            if (!await _context.Lookups.AnyAsync(l => l.Id == lookupId))
            {
                return NotFound("Lookup list not found.");
            }

            var newItem = new LookupItem
            {
                LookupId = lookupId,
                Value = dto.Value
            };

            await _context.LookupItems.AddAsync(newItem);
            await _context.SaveChangesAsync();

            return Ok(newItem);
        }

        // PUT: api/Admin/lookup-items/{itemId}
        [HttpPut("lookup-items/{itemId}")]
        public async Task<IActionResult> UpdateLookupItem(int itemId, [FromBody] CreateLookupItemDto dto)
        {
            var item = await _context.LookupItems.FindAsync(itemId);
            if (item == null)
            {
                return NotFound("Lookup item not found.");
            }

            item.Value = dto.Value;
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        // DELETE: api/Admin/lookup-items/{itemId}
        [HttpDelete("lookup-items/{itemId}")]
        public async Task<IActionResult> DeleteLookupItem(int itemId)
        {
            var item = await _context.LookupItems.FindAsync(itemId);
            if (item == null)
            {
                return NotFound("Lookup item not found.");
            }

            _context.LookupItems.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent(); // 204 No Content
        }

        //[HttpGet("designers")]
        //public async Task<IActionResult> GetDesigners()
        //{
        //    var designers = await _userManager.GetUsersInRoleAsync("Designer");
        //    var result = designers.Select(d => new { d.Id, d.UserName }).ToList();
        //    return Ok(result);
        //}

        // GET: api/Admin/lookups
        [HttpGet("lookups")]
        public async Task<IActionResult> GetLookups()
        {
            var lookups = await _context.Lookups
                .Select(l => new LookupDto { Id = l.Id, Name = l.Name })
                .ToListAsync();
            return Ok(lookups);
        }

        // GET: api/Admin/reports/designer-performance
        [HttpGet("reports/designer-performance")]
        public async Task<IActionResult> GetDesignerPerformanceReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var performanceData = await _context.Requests
                .Where(r => r.Status == Core.Enums.RequestStatus.Completed &&
                            r.CompletionDate.HasValue &&
                            r.CompletionDate.Value.Date >= startDate.Date &&
                            r.CompletionDate.Value.Date <= endDate.Date &&
                            r.DesignerId != null)
                .GroupBy(r => r.DesignerId)
                .Select(g => new
                {
                    DesignerId = g.Key,
                    CompletedCount = g.Count()
                })
                .ToListAsync();

            // گرفتن نام طراحان
            var designerIds = performanceData.Select(p => p.DesignerId).ToList();
            var designers = await _context.Users
                .Where(u => designerIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.UserName);

            var result = performanceData.Select(p => new DesignerPerformanceDto
            {
                DesignerId = p.DesignerId,
                DesignerName = designers.ContainsKey(p.DesignerId) ? designers[p.DesignerId] : "Unknown",
                CompletedCount = p.CompletedCount
            }).ToList();

            return Ok(result);
        }

        // POST: api/Admin/users
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            var userExists = await _userManager.FindByNameAsync(createUserDto.Username);
            if (userExists != null)
                return BadRequest("کاربری با این نام کاربری از قبل وجود دارد.");

            AppUser user = new()
            {
                Email = createUserDto.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = createUserDto.Username
            };

            var result = await _userManager.CreateAsync(user, createUserDto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            if (createUserDto.Roles != null && createUserDto.Roles.Any())
            {
                await _userManager.AddToRolesAsync(user, createUserDto.Roles);
            }

            return Ok(new { message = "کاربر با موفقیت ایجاد شد." });
        }

        // DELETE: api/Admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("کاربر یافت نشد.");
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return NoContent(); // 204 No Content
        }

        //// GET: api/Admin/approvers
        //[HttpGet("approvers")]
        //public async Task<IActionResult> GetApprovers()
        //{
        //    var approvers = await _userManager.GetUsersInRoleAsync("Approver");
        //    var result = approvers.Select(d => new { d.Id, d.UserName }).ToList();
        //    return Ok(result);
        //}
    }
}