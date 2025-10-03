using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class EnvironmentalAdStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.EnvironmentalAd;
        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.EnvironmentalAdDetails == null)
            {
                throw new ArgumentException("Environmental Ad details are required.");
            }


            var isValid = await context.LookupItems.AnyAsync(i => i.Id == dto.EnvironmentalAdDetails.AdTypeId && i.Lookup.Name == "EnvironmentalAdTypes");
            if (!isValid)
            {
                throw new ArgumentException($"Invalid EnvironmentalAd Type ID: {dto.EnvironmentalAdDetails.AdTypeId}");
            }
            var detail = new EnvironmentalAdDetail
            {
                RequestId = mainRequest.Id,
                AdTypeId = dto.EnvironmentalAdDetails.AdTypeId,
                Quantity = dto.EnvironmentalAdDetails.Quantity,
                Description = dto.EnvironmentalAdDetails.Description
            };
            await context.EnvironmentalAdDetails.AddAsync(detail);
        }
    }
}
