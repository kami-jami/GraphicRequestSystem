using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class PromotionalItemDetailDto
    {
        [Required]
        public required string ItemName { get; set; }
        [Required] 
        public int Quantity { get; set; }
        [Required] 
        public required string Description { get; set; }
    }
}
