using GraphicRequestSystem.API.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class Request
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public required string Title { get; set; } // یک عنوان کلی برای درخواست

        [Required]
        public int RequestTypeId { get; set; } // Foreign key
        public LookupItem RequestType { get; set; } = null!;

        public RequestStatus Status { get; set; }
        public RequestPriority Priority { get; set; }

        // فعلا شناسه کاربران را string در نظر میگیریم تا بعدا سیستم کاربران را کامل کنیم
        [Required]
        public required string RequesterId { get; set; }
        public string? DesignerId { get; set; }
        public string? ApproverId { get; set; }

        public DateTime SubmissionDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CompletionDate { get; set; }
    }
}
