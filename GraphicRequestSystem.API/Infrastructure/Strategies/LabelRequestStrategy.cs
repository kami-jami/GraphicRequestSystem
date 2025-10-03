using GraphicRequestSystem.API.Core;
using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.DTOs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;


namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class LabelRequestStrategy : IRequestDetailStrategy
    {
        public string StrategyName => RequestTypeValues.Label;

        public async Task ProcessDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            if (dto.LabelDetails == null)
            {
                throw new ArgumentException("Label details are required.");
            }

            var isLabelTypeValid = await context.LookupItems.AnyAsync(i => i.Id == dto.LabelDetails.LabelTypeId && i.Lookup.Name == "LabelTypes");
            if (!isLabelTypeValid)
            {
                throw new ArgumentException($"Invalid LabelType ID: {dto.LabelDetails.LabelTypeId}");
            }

            var isUnitValid = await context.LookupItems.AnyAsync(i => i.Id == dto.LabelDetails.MeasurementUnitId && i.Lookup.Name == "MeasurementUnits");
            if (!isUnitValid)
            {
                throw new ArgumentException($"Invalid MeasurementUnit ID: {dto.LabelDetails.MeasurementUnitId}");
            }

            var labelDetail = new LabelRequestDetail
            {
                RequestId = mainRequest.Id,
                ProductNameFA = dto.LabelDetails.ProductNameFA,
                ProductNameEN = dto.LabelDetails.ProductNameEN,
                Brand = dto.LabelDetails.Brand,
                LabelTypeId = dto.LabelDetails.LabelTypeId,
                TechnicalSpecs = dto.LabelDetails.TechnicalSpecs,
                Dimensions = dto.LabelDetails.Dimensions,
                PrintQuantity = dto.LabelDetails.PrintQuantity,
                MeasurementValue = dto.LabelDetails.MeasurementValue,
                MeasurementUnitId = dto.LabelDetails.MeasurementUnitId,
                Description = dto.LabelDetails.Description
            };
            await context.LabelRequestDetails.AddAsync(labelDetail);
        }
    }
}