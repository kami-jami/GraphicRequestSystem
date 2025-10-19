namespace GraphicRequestSystem.API.DTOs
{
    /// <summary>
    /// DTO for creating a new designer note
    /// </summary>
    public class CreateDesignerNoteDto
    {
        public required string NoteText { get; set; }
    }
}
