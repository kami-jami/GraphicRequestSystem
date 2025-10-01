using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class Comment
    {
        public int Id { get; set; }
        public required string Content { get; set; }
        public DateTime CreatedAt { get; set; }

        public int RequestId { get; set; }
        public Request Request { get; set; } = null!;

        public required string AuthorId { get; set; }
        public AppUser Author { get; set; } = null!;
    }
}