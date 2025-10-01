using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class UpdateUserRolesDto
    {
        [Required]
        public required string[] Roles { get; set; }
    }
}