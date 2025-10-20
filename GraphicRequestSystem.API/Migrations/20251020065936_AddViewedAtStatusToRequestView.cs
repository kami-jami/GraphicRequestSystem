using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraphicRequestSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddViewedAtStatusToRequestView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RequestViews_UserId_RequestId",
                table: "RequestViews");

            migrationBuilder.AddColumn<int>(
                name: "ViewedAtStatus",
                table: "RequestViews",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_RequestViews_UserId_RequestId",
                table: "RequestViews",
                columns: new[] { "UserId", "RequestId" });

            migrationBuilder.CreateIndex(
                name: "IX_RequestViews_UserId_RequestId_ViewedAtStatus",
                table: "RequestViews",
                columns: new[] { "UserId", "RequestId", "ViewedAtStatus" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RequestViews_UserId_RequestId",
                table: "RequestViews");

            migrationBuilder.DropIndex(
                name: "IX_RequestViews_UserId_RequestId_ViewedAtStatus",
                table: "RequestViews");

            migrationBuilder.DropColumn(
                name: "ViewedAtStatus",
                table: "RequestViews");

            migrationBuilder.CreateIndex(
                name: "IX_RequestViews_UserId_RequestId",
                table: "RequestViews",
                columns: new[] { "UserId", "RequestId" },
                unique: true);
        }
    }
}
