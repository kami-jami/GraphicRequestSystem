using GraphicRequestSystem.API.Core.Enums;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AvailabilityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AvailabilityController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Availability
        [HttpGet]
        public async Task<IActionResult> GetAvailability([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            // 1. Get settings from the database
            var settings = await _context.SystemSettings
                .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

            var maxNormal = int.Parse(settings.GetValueOrDefault("MaxNormalRequestsPerDay", "5"));
            var maxUrgent = int.Parse(settings.GetValueOrDefault("MaxUrgentRequestsPerDay", "2"));

            // 2. Get request counts grouped by date and priority
            var requestCounts = await _context.Requests
                .Where(r => r.DueDate.Date >= startDate.Date && r.DueDate.Date <= endDate.Date)
                .GroupBy(r => new { r.DueDate.Date, r.Priority })
                .Select(g => new
                {
                    g.Key.Date,
                    g.Key.Priority,
                    Count = g.Count()
                })
                .ToListAsync();

            // 3. Calculate availability for each day in the range
            var availabilityList = new List<DateAvailabilityDto>();
            for (var day = startDate.Date; day <= endDate.Date; day = day.AddDays(1))
            {
                var normalCount = requestCounts
                    .FirstOrDefault(rc => rc.Date == day && rc.Priority == RequestPriority.Normal)?.Count ?? 0;

                var urgentCount = requestCounts
                    .FirstOrDefault(rc => rc.Date == day && rc.Priority == RequestPriority.Urgent)?.Count ?? 0;

                availabilityList.Add(new DateAvailabilityDto
                {
                    Date = day,
                    IsNormalSlotAvailable = normalCount < maxNormal,
                    IsUrgentSlotAvailable = urgentCount < maxUrgent
                });
            }

            return Ok(availabilityList);
        }
    }
}
