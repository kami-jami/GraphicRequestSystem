using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class CreateUserDto
    {
        [Required]
        public string Username { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        public string[] Roles { get; set; }
    }
}