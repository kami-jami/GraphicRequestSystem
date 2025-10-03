using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class EnvironmentalAdDetail
    {
        [Key] 
        public int RequestId { get; set; }
        [ForeignKey("RequestId")] 
        public Request Request { get; set; } = null!;
        [Required] 
        public int AdTypeId { get; set; } // از Lookup خوانده می‌شود
        [Required] 
        public required string Description { get; set; }
        public int? Quantity { get; set; }
    }
}
