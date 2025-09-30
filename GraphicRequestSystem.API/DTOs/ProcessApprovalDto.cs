using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class ProcessApprovalDto
    {
        [Required]
        public required string ActorId { get; set; } // شناسه تایید کننده

        [Required]
        public bool IsApproved { get; set; } // آیا تایید شده است؟

        public string? Comment { get; set; } // توضیحات (در صورت رد کردن الزامی است)
    }
}
