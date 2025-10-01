namespace GraphicRequestSystem.API.DTOs
{
    public class AdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int TotalRequests { get; set; }
        public int PendingRequests { get; set; }
        public int OverdueRequests { get; set; }
        public List<StatusCountDto> RequestsByStatus { get; set; } = new List<StatusCountDto>();
    }
}