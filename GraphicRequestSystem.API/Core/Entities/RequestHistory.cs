using GraphicRequestSystem.API.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.Core.Entities
{
    public class RequestHistory
    {
        public int Id { get; set; }

        public int RequestId { get; set; } // Foreign key to the Request
        public Request Request { get; set; } = null!;

        public DateTime ActionDate { get; set; } // زمان ثبت رویداد

        [Required]
        public required string ActorId { get; set; }
        public AppUser Actor { get; set; } = null!;

        public RequestStatus PreviousStatus { get; set; } // وضعیت قبلی
        public RequestStatus NewStatus { get; set; } // وضعیت جدید

        public string? Comment { get; set; } // توضیحات (مثلا دلیل برگشت)
    }
}
