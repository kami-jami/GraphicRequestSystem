using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class PromotionalVideoDetail
    {
        [Key]
        public int RequestId { get; set; }
        [ForeignKey("RequestId")]
        public Request Request { get; set; } = null!;
        [Required]
        public required string ProductName { get; set; }
        [Required]
        public required string Brand { get; set; }
        [Required]
        public required string Description { get; set; }
    }
}