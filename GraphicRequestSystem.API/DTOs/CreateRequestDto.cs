using GraphicRequestSystem.API.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class CreateRequestDto
    {
        [Required]
        [MaxLength(200)]
        public required string Title { get; set; }

        [Required]
        public int RequestTypeId { get; set; }

        public RequestPriority Priority { get; set; }

        [Required]
        public required string RequesterId { get; set; } // فعلا یک متن ساده میگیریم

        public DateTime DueDate { get; set; }

        public LabelRequestDetailDto? LabelDetails { get; set; }

    }
}
