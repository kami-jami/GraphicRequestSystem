using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class AssignDesignerDto
    {
        [Required]
        public required string DesignerId { get; set; }
    }
}
