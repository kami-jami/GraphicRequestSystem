using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class PackagingPhotoDetailDto
    {
        [Required]
        public required string ProductName { get; set; }

        [Required]
        public required string Brand { get; set; }
        public string? Description { get; set; }
    }
}