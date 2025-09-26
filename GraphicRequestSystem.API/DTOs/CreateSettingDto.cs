namespace GraphicRequestSystem.API.DTOs
{
    public class CreateSettingDto
    {
        public required string SettingKey { get; set; }
        public required string SettingValue { get; set; }
    }
}
