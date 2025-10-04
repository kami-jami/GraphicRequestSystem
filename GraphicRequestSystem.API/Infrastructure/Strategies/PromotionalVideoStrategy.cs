using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class PromotionalVideoStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.PromotionalVideo;

        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.PromotionalVideoDetails == null)
            {
                throw new ArgumentException("Promotional video details are required.");
            }

            var detail = new PromotionalVideoDetail
            {
                RequestId = mainRequest.Id,
                ProductName = dto.PromotionalVideoDetails.ProductName,
                Brand = dto.PromotionalVideoDetails.Brand,
                Description = dto.PromotionalVideoDetails.Description
            };

            await context.PromotionalVideoDetails.AddAsync(detail);
        }
    }
}
