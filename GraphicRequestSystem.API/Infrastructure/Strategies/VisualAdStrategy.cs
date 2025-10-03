using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class VisualAdStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.VisualAd;
        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.VisualAdDetails == null)
            {
                throw new ArgumentException("Visual Ad details are required.");
            }

            
            var isValid = await context.LookupItems.AnyAsync(i => i.Id == dto.VisualAdDetails.AdTypeId && i.Lookup.Name == "VisualAdTypes");
            if (!isValid)
            {
                throw new ArgumentException($"Invalid VisualAd Type ID: {dto.VisualAdDetails.AdTypeId}");
            }
            var detail = new VisualAdDetail
            {
                RequestId = mainRequest.Id,
                AdTypeId = dto.VisualAdDetails.AdTypeId,
                Brand = dto.VisualAdDetails.Brand,
                Description = dto.VisualAdDetails.Description
            };
            await context.VisualAdDetails.AddAsync(detail);
        }
    }
}
