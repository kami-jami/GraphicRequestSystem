using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraphicRequestSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLabelRequestDetailEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LabelRequestDetails",
                columns: table => new
                {
                    RequestId = table.Column<int>(type: "int", nullable: false),
                    ProductNameFA = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ProductNameEN = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LabelTypeId = table.Column<int>(type: "int", nullable: false),
                    TechnicalSpecs = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Dimensions = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PrintQuantity = table.Column<int>(type: "int", nullable: true),
                    MeasurementValue = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MeasurementUnitId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabelRequestDetails", x => x.RequestId);
                    table.ForeignKey(
                        name: "FK_LabelRequestDetails_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LabelRequestDetails");
        }
    }
}
