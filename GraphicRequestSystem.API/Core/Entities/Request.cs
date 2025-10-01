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

        
        [Required]
        public required string RequesterId { get; set; }
        public AppUser Requester { get; set; } = null!;

        public string? DesignerId { get; set; }
        public AppUser? Designer { get; set; }

        public string? ApproverId { get; set; }
        public AppUser? Approver { get; set; }

        public DateTime SubmissionDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CompletionDate { get; set; }
    }
}
