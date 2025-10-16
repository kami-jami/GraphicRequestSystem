namespace GraphicRequestSystem.API.Core.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int RequestId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // e.g., "StatusChange", "Assignment", "Approval"
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now; // Use local time instead of UTC

        // Navigation properties
        public AppUser User { get; set; } = null!;
        public Request Request { get; set; } = null!;
    }
}
