using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class PromotionalVideoDetailDto
    {
        [Required]
        public required string ProductName { get; set; }
        [Required]
        public required string Brand { get; set; }
        [Required]
        public required string Description { get; set; }
    }
}