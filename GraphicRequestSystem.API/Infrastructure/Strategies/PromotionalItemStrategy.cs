using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class PromotionalItemStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.PromotionalItem;

        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.PromotionalItemDetails == null)
            {
                throw new ArgumentException("Promotional Item details are required.");
            }
            var detail = new PromotionalItemDetail
            {
                RequestId = mainRequest.Id,
                ItemName = dto.PromotionalItemDetails.ItemName,
                Quantity = dto.PromotionalItemDetails.Quantity,
                Description = dto.PromotionalItemDetails.Description
            };
            await context.PromotionalItemDetails.AddAsync(detail);
        }

        public async Task UpdateDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            var detail = await context.PromotionalItemDetails.FindAsync(mainRequest.Id);
            if (detail != null && dto.PromotionalItemDetails != null)
            {
                detail.ItemName = dto.PromotionalItemDetails.ItemName;
                detail.Quantity = dto.PromotionalItemDetails.Quantity;
                detail.Description = dto.PromotionalItemDetails.Description;
                context.PromotionalItemDetails.Update(detail);
            }
        }
    }
}
