using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class LabelRequestDetail
    {
        [Key] // Defines this property as the primary key
        public int RequestId { get; set; } // This is BOTH PK and FK

        [ForeignKey("RequestId")] // Explicitly defines the foreign key relationship
        public Request Request { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public required string ProductNameFA { get; set; }

        [Required]
        [MaxLength(200)]
        public required string ProductNameEN { get; set; }

        [Required]
        public required string Brand { get; set; }

        // We'll handle "نوع لیبل" later using our Lookup system
        [Required]
        public int LabelTypeId { get; set; }

        [Required]
        public required string TechnicalSpecs { get; set; }

        [MaxLength(100)]
        public string? Dimensions { get; set; } // ابعاد لیبل (اختیاری)

        public int? PrintQuantity { get; set; } // تعداد چاپ (اختیاری)

        [Required]
        [MaxLength(100)]
        public required string MeasurementValue { get; set; } // مقدار

        [Required]
        public int MeasurementUnitId { get; set; } // واحد اندازه گیری
    }
}