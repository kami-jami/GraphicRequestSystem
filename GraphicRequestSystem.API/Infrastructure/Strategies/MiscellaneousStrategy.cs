using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class MiscellaneousStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.Miscellaneous;

        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.MiscellaneousDetails == null)
            {
                throw new ArgumentException("Miscellaneous details are required.");
            }
            var detail = new MiscellaneousDetail
            {
                RequestId = mainRequest.Id,
                Topic = dto.MiscellaneousDetails.Topic,
                Description = dto.MiscellaneousDetails.Description
            };
            await context.MiscellaneousDetails.AddAsync(detail);
        }
    }
}
