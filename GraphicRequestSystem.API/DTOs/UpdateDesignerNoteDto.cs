namespace GraphicRequestSystem.API.DTOs
{
    /// <summary>
    /// DTO for updating an existing designer note
    /// </summary>
    public class UpdateDesignerNoteDto
    {
        public required string NoteText { get; set; }
    }
}
