namespace GraphicRequestSystem.API.DTOs
{
    public class DateAvailabilityDto
    {
        public DateTime Date { get; set; }
        public bool IsNormalSlotAvailable { get; set; }
        public bool IsUrgentSlotAvailable { get; set; }
    }
}
