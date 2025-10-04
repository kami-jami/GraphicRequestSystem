using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
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
        public LookupController(AppDbContext context) { _context = context; }

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
    }
}

