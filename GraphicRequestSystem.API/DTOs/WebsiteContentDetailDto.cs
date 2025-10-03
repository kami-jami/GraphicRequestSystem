using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class WebsiteContentDetailDto
    {
        [Required]
        public int ContentTypeId { get; set; }
        [Required]
        public required string Topic { get; set; }
        [Required]
        public required string Description { get; set; }
    }
}