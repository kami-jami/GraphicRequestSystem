using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class MiscellaneousDetail
    {
        [Key] 
        public int RequestId { get; set; }
        [ForeignKey("RequestId")] 
        public Request Request { get; set; } = null!;
        [Required] 
        public required string Topic { get; set; }
        [Required] 
        public required string Description { get; set; }
    }
}
