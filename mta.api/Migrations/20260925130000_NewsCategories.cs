using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Mta.Api.Migrations;

[DbContext(typeof(AppDb))]
[Migration("20260925130000_NewsCategories")]
public partial class NewsCategories : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Category",
            table: "News",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "news");

        migrationBuilder.AddCheckConstraint(
            name: "CK_News_Category",
            table: "News",
            sql: "\"Category\" IN ('news', 'article', 'blog')");

        migrationBuilder.Sql("UPDATE \"News\" SET \"Category\" = 'article' WHERE \"Slug\" = 'new-hiking-routes-in-mestia'");
        migrationBuilder.Sql("UPDATE \"News\" SET \"Category\" = 'blog' WHERE \"Slug\" = 'summer-activities-in-bakuriani'");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint(name: "CK_News_Category", table: "News");
        migrationBuilder.DropColumn(name: "Category", table: "News");
    }
}
