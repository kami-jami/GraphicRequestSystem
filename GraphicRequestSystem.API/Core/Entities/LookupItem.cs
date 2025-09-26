namespace GraphicRequestSystem.API.Core.Entities
{
    public class LookupItem
    {
        public int Id { get; set; }
        public int LookupId { get; set; } // Renamed from ListId
        public required string Value { get; set; } // Renamed from ItemValue

        public Lookup Lookup { get; set; } = null!;
    }
}