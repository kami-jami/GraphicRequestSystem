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
