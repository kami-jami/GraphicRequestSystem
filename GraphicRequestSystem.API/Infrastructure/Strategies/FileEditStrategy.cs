using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class FileEditStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.FileEdit;

        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.FileEditDetails == null)
            {
                throw new ArgumentException("File Edit details are required.");
            }
            var detail = new FileEditDetail
            {
                RequestId = mainRequest.Id,
                Topic = dto.FileEditDetails.Topic,
                Description = dto.FileEditDetails.Description
            };
            await context.FileEditDetails.AddAsync(detail);
        }

        public async Task UpdateDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            var details = await context.FileEditDetails.FindAsync(mainRequest.Id);
            if (details != null && dto.FileEditDetails != null)
            {
                details.Topic = dto.FileEditDetails.Topic;
                details.Description = dto.FileEditDetails.Description;
                context.FileEditDetails.Update(details);
            }
        }
    }
}
