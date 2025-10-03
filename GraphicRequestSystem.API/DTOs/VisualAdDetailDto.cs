using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class VisualAdDetailDto
    {
        [Required] 
        public int AdTypeId { get; set; }
        [Required] 
        public required string Brand { get; set; }
        [Required] 
        public required string Description { get; set; }
    }
}
