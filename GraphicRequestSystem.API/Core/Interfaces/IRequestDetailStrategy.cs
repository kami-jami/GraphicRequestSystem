using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;

namespace GraphicRequestSystem.API.Core.Interfaces
{
    public interface IRequestDetailStrategy
    {
        // یک نام منحصر به فرد برای هر استراتژی
        string StrategyName { get; }

        // متدی که منطق پردازش جزئیات را اجرا می‌کند
        Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context);

        Task UpdateDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context);
    }
}