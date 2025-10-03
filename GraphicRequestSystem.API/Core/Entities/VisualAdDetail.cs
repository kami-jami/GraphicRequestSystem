using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class VisualAdDetail
    {
        [Key] 
        public int RequestId { get; set; }
        [ForeignKey("RequestId")] 
        public Request Request { get; set; } = null!;
        [Required] 
        public int AdTypeId { get; set; } 
        [Required] 
        public required string Brand { get; set; }
        [Required] 
        public required string Description { get; set; }
    }
}
