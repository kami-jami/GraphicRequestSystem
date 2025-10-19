namespace GraphicRequestSystem.API.DTOs
{
    /// <summary>
    /// DTO for returning designer note information
    /// </summary>
    public class DesignerNoteDto
    {
        public int Id { get; set; }
        public int RequestId { get; set; }
        public string DesignerId { get; set; } = string.Empty;
        public string DesignerName { get; set; } = string.Empty;
        public string NoteText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
