namespace GraphicRequestSystem.API.DTOs
{
    public class DateAvailabilityDto
    {
        public DateTime Date { get; set; }
        public bool IsNormalSlotAvailable { get; set; }
        public bool IsUrgentSlotAvailable { get; set; }
        
        // Enhanced capacity information
        public int NormalSlotsUsed { get; set; }
        public int NormalSlotsTotal { get; set; }
        public int UrgentSlotsUsed { get; set; }
        public int UrgentSlotsTotal { get; set; }
        public int NormalSlotsRemaining => NormalSlotsTotal - NormalSlotsUsed;
        public int UrgentSlotsRemaining => UrgentSlotsTotal - UrgentSlotsUsed;
    }
}
