using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class WebsiteContentStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.WebsiteContent;
        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.WebsiteContentDetails == null)
            {
                throw new ArgumentException("Website content details are required.");
            }

            var isValid = await context.LookupItems.AnyAsync(i => i.Id == dto.WebsiteContentDetails.ContentTypeId && i.Lookup.Name == "WebsiteContentTypes");
            if (!isValid)
            {
                throw new ArgumentException($"Invalid WebsiteContent Type ID: {dto.WebsiteContentDetails.ContentTypeId}");
            }
            var detail = new WebsiteContentDetail
            {
                RequestId = mainRequest.Id,
                Topic = dto.WebsiteContentDetails.Topic,
                ContentTypeId = dto.WebsiteContentDetails.ContentTypeId,
                Description = dto.WebsiteContentDetails.Description
            };
            await context.WebsiteContentDetails.AddAsync(detail);
        }
    }
}
