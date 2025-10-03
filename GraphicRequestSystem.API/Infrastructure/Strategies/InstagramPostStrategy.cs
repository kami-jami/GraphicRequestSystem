using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class InstagramPostStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.InstagramPost;

        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.InstagramPostDetails == null)
            {
                throw new ArgumentException("Instagram Post details are required.");
            }
            var detail = new InstagramPostDetail
            {
                RequestId = mainRequest.Id,
                Topic = dto.InstagramPostDetails.Topic,
                Description = dto.InstagramPostDetails.Description
            };
            await context.InstagramPostDetails.AddAsync(detail);
        }
    }
}