namespace GraphicRequestSystem.API.Core.Entities
{
    /// <summary>
    /// Tracks when a user views a specific request at a specific status
    /// Used to determine unread status per-request per-status-change
    /// When status changes, request becomes unread again for relevant users
    /// </summary>
    public class RequestView
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;

        public int RequestId { get; set; }

        /// <summary>
        /// The status of the request when it was viewed
        /// Used to determine if request should be marked unread after status change
        /// </summary>
        public Core.Enums.RequestStatus ViewedAtStatus { get; set; }

        public DateTime ViewedAt { get; set; }

        // Navigation properties
        public AppUser User { get; set; } = null!;
        public Request Request { get; set; } = null!;
    }
}
