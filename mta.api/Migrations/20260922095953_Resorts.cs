using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mta.Api.Migrations
{
    /// <inheritdoc />
    public partial class Resorts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Resorts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    KaJson = table.Column<string>(type: "jsonb", nullable: false),
                    EnJson = table.Column<string>(type: "jsonb", nullable: false),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Resorts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Resorts_Slug",
                table: "Resorts",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Resorts");
        }
    }
}
