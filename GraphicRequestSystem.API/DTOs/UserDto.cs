namespace GraphicRequestSystem.API.DTOs
{
    public class UserDto
    {
        public required string Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }
}