namespace GraphicRequestSystem.API.Core.Entities
{
    public class SystemSetting
    {
        public int Id { get; set; }
        public required string SettingKey { get; set; }
        public required string SettingValue { get; set; }
    }
}
