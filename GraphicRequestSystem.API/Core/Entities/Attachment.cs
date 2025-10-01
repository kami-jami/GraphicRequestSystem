namespace GraphicRequestSystem.API.Core.Entities
{
    public class Attachment
    {
        public int Id { get; set; }
        public int RequestId { get; set; } // Foreign key
        public Request Request { get; set; } = null!;

        public required string OriginalFileName { get; set; }
        public required string StoredFileName { get; set; } 
        public required string FilePath { get; set; }
        public long FileSize { get; set; }
        public required string ContentType { get; set; }
        public DateTime UploadDate { get; set; }
    }
}