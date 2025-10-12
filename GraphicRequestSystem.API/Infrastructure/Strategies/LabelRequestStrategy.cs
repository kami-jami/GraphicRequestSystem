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

        public async Task UpdateDetailsAsync(Request mainRequest, CreateRequestDto dto, AppDbContext context)
        {
            var details = await context.LabelRequestDetails.FindAsync(mainRequest.Id);
            if (details != null && dto.LabelDetails != null)
            {
                details.ProductNameFA = dto.LabelDetails.ProductNameFA;
                details.ProductNameEN = dto.LabelDetails.ProductNameEN;
                details.Brand = dto.LabelDetails.Brand;
                details.LabelTypeId = dto.LabelDetails.LabelTypeId;
                details.TechnicalSpecs = dto.LabelDetails.TechnicalSpecs;
                details.Dimensions = dto.LabelDetails.Dimensions;
                details.PrintQuantity = dto.LabelDetails.PrintQuantity;
                details.MeasurementValue = dto.LabelDetails.MeasurementValue;
                details.MeasurementUnitId = dto.LabelDetails.MeasurementUnitId;

                context.LabelRequestDetails.Update(details);
            }
        }
    }
}