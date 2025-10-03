using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class InstagramPostDetailDto
    {
        [Required]
        public required string Topic { get; set; }
        [Required]
        public required string Description { get; set; }
    }
}