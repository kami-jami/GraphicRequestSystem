using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class PackagingPhotoStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.PackagingPhoto;

        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.PackagingPhotoDetails == null)
            {
                throw new ArgumentException("Packaging photo details are required.");
            }

            var photoDetail = new PackagingPhotoDetail
            {
                RequestId = mainRequest.Id,
                ProductName = dto.PackagingPhotoDetails.ProductName,
                Brand = dto.PackagingPhotoDetails.Brand,
                Description = dto.PackagingPhotoDetails.Description

            };
            await context.PackagingPhotoDetails.AddAsync(photoDetail);
        }
    }
}