namespace GraphicRequestSystem.API.DTOs
{
    public class UserDto
    {
        public required string Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }
}