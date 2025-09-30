using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class CompleteDesignDto
    {
        [Required]
        public required string ActorId { get; set; }
        [Required]
        public bool NeedsApproval { get; set; }

        public string? ApproverId { get; set; }
        public string? Comment { get; set; }
    }
}
