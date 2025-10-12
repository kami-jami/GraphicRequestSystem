using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class CreateUserDto
    {
        [Required]
        public string Username { get; set; }

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        public string[] Roles { get; set; }
    }
}