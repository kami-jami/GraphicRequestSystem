using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraphicRequestSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultDesignerSetting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "SettingKey", "SettingValue" },
                values: new object[] { 5, "DefaultDesignerId", "b5fc3c65-9d43-4558-bb11-dd82eba9149d" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 5);
        }
    }
}
