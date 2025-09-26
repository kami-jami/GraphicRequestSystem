using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class LabelRequestDetailDto
    {
        [Required]
        public required string ProductNameFA { get; set; }
        [Required]
        public required string ProductNameEN { get; set; }
        [Required]
        public required string Brand { get; set; }
        [Required]
        public int LabelTypeId { get; set; }
        [Required]
        public required string TechnicalSpecs { get; set; }
        public string? Dimensions { get; set; }
        public int? PrintQuantity { get; set; }
        [Required]
        public required string MeasurementValue { get; set; }
        [Required]
        public int MeasurementUnitId { get; set; }
    }
}
