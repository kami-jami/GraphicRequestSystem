using GraphicRequestSystem.API.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class CreateRequestDto
    {
        [Required]
        [MaxLength(200)]
        public required string Title { get; set; }

        [Required]
        public int RequestTypeId { get; set; }

        public RequestPriority Priority { get; set; }

        public DateTime? DueDate { get; set; }

        public LabelRequestDetailDto? LabelDetails { get; set; }
        public PackagingPhotoDetailDto? PackagingPhotoDetails { get; set; }
        public InstagramPostDetailDto? InstagramPostDetails { get; set; }
        public PromotionalVideoDetailDto? PromotionalVideoDetails { get; set; }
        public WebsiteContentDetailDto? WebsiteContentDetails { get; set; }
        public FileEditDetailDto? FileEditDetails { get; set; }
        public PromotionalItemDetailDto? PromotionalItemDetails { get; set; }
        public VisualAdDetailDto? VisualAdDetails { get; set; }
        public EnvironmentalAdDetailDto? EnvironmentalAdDetails { get; set; }
        public MiscellaneousDetailDto? MiscellaneousDetails { get; set; }

    }
}
