using GraphicRequestSystem.API.Core.Enums;

namespace GraphicRequestSystem.API.DTOs
{
    public class StatusCountDto
    {
        public RequestStatus Status { get; set; }
        public string StatusName { get; set; }
        public int Count { get; set; }
    }
}