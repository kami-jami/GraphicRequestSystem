using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class ReturnRequestDto
    {
        [Required]
        public required string Comment { get; set; }
        [Required]
        public required string ActorId { get; set; } // شناسه کاربری که درخواست را برمیگرداند (طراح)
    }
}
