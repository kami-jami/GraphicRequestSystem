using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraphicRequestSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddHistoryIdToAttachment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RequestHistoryId",
                table: "Attachments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_RequestHistoryId",
                table: "Attachments",
                column: "RequestHistoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_RequestHistories_RequestHistoryId",
                table: "Attachments",
                column: "RequestHistoryId",
                principalTable: "RequestHistories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_RequestHistories_RequestHistoryId",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_RequestHistoryId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "RequestHistoryId",
                table: "Attachments");
        }
    }
}
