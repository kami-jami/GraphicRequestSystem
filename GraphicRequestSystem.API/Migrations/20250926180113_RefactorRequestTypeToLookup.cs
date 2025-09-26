using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GraphicRequestSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class RefactorRequestTypeToLookup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequestType",
                table: "Requests");

            migrationBuilder.AddColumn<int>(
                name: "RequestTypeId",
                table: "Requests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Lookups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lookups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LookupItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LookupId = table.Column<int>(type: "int", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LookupItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LookupItems_Lookups_LookupId",
                        column: x => x.LookupId,
                        principalTable: "Lookups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Lookups",
                columns: new[] { "Id", "Name" },
                values: new object[] { 1, "RequestTypes" });

            migrationBuilder.InsertData(
                table: "LookupItems",
                columns: new[] { "Id", "LookupId", "Value" },
                values: new object[,]
                {
                    { 1, 1, "طراحی لیبل" },
                    { 2, 1, "عکس بسته‌بندی محصولات" },
                    { 3, 1, "پست اینستاگرام" },
                    { 4, 1, "ویدئو تبلیغاتی" },
                    { 5, 1, "محتوا برای سایت" },
                    { 6, 1, "ویرایش فایل" },
                    { 7, 1, "کالای تبلیغاتی" },
                    { 8, 1, "تبلیغات بصری" },
                    { 9, 1, "تبلیغات محیطی" },
                    { 10, 1, "متفرقه" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Requests_RequestTypeId",
                table: "Requests",
                column: "RequestTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LookupItems_LookupId",
                table: "LookupItems",
                column: "LookupId");

            migrationBuilder.AddForeignKey(
                name: "FK_Requests_LookupItems_RequestTypeId",
                table: "Requests",
                column: "RequestTypeId",
                principalTable: "LookupItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Requests_LookupItems_RequestTypeId",
                table: "Requests");

            migrationBuilder.DropTable(
                name: "LookupItems");

            migrationBuilder.DropTable(
                name: "Lookups");

            migrationBuilder.DropIndex(
                name: "IX_Requests_RequestTypeId",
                table: "Requests");

            migrationBuilder.DropColumn(
                name: "RequestTypeId",
                table: "Requests");

            migrationBuilder.AddColumn<string>(
                name: "RequestType",
                table: "Requests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
