using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Infrastructure.Data;
using GraphicRequestSystem.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            return Ok(settings);
        }

        // Public endpoint for non-sensitive settings (no auth required)
        [HttpGet("public")]
        public async Task<IActionResult> GetPublicSettings()
        {
            // Only return settings that are safe for public access
            var publicSettingKeys = new[] 
            { 
                "OrderableDaysInFuture",
                "MaxNormalRequestsPerDay",
                "MaxUrgentRequestsPerDay"
            };

            var publicSettings = await _context.SystemSettings
                .Where(s => publicSettingKeys.Contains(s.SettingKey))
                .ToListAsync();

            return Ok(publicSettings);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSetting(CreateSettingDto createSettingDto)
        {
            if (createSettingDto == null || string.IsNullOrWhiteSpace(createSettingDto.SettingKey) || string.IsNullOrWhiteSpace(createSettingDto.SettingValue))
            {
                return BadRequest("Invalid setting data.");
            }
            var newSetting = new SystemSetting
            {
                SettingKey = createSettingDto.SettingKey,
                SettingValue = createSettingDto.SettingValue
            };
            await _context.SystemSettings.AddAsync(newSetting);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSettings), new { id = newSetting.Id }, newSetting);
        }
    }
}
