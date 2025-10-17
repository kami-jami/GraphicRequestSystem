using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraphicRequestSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddInboxViewTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InboxViews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    InboxCategory = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LastViewedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboxViews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InboxViews_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InboxViews_UserId_InboxCategory",
                table: "InboxViews",
                columns: new[] { "UserId", "InboxCategory" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InboxViews");
        }
    }
}
