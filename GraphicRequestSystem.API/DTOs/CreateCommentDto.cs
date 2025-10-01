using System.ComponentModel.DataAnnotations;
namespace GraphicRequestSystem.API.DTOs
{
    public class CreateCommentDto
    {
        [Required]
        public required string Content { get; set; }
    }
}