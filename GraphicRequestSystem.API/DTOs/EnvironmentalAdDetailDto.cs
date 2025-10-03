using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class EnvironmentalAdDetailDto
    {
        [Required] 
        public int AdTypeId { get; set; }
        [Required] 
        public required string Description { get; set; }
        public int? Quantity { get; set; }
    }
}
