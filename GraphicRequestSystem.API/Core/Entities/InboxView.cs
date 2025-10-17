namespace GraphicRequestSystem.API.Core.Entities
{
    public class InboxView
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string InboxCategory { get; set; } = string.Empty; // e.g., "requester_needsAction", "designer_inProgress"
        public DateTime LastViewedAt { get; set; }

        // Navigation properties
        public AppUser User { get; set; } = null!;
    }
}
