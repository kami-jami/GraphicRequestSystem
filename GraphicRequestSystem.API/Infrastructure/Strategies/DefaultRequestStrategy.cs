using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class DefaultRequestStrategy : IRequestDetailStrategy
    {
        public string StrategyName => "Default"; // یک نام عمومی

        public Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            // No specific details to process, so we do nothing.
            return Task.CompletedTask;
        }
    }
}