using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.Core.Entities
{
    /// <summary>
    /// Private notes that designers can create for their own reference.
    /// These notes are completely confidential and only visible to the designer who created them.
    /// Other roles (Requester, Approver, Admin) cannot see these notes.
    /// </summary>
    public class DesignerNote
    {
        public int Id { get; set; }

        [Required]
        public int RequestId { get; set; }
        public Request Request { get; set; } = null!;

        [Required]
        public required string DesignerId { get; set; }
        public AppUser Designer { get; set; } = null!;

        [Required]
        [MaxLength(5000)]
        public required string NoteText { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public bool IsDeleted { get; set; } = false; // Soft delete for data retention
    }
}
