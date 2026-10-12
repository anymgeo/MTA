using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Mta.Api.Migrations;

[DbContext(typeof(AppDb))]
[Migration("20261006120000_TwoNewsCategories")]
public class TwoNewsCategories : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Keep every article and its existing audit history; editorial articles become Blog.
        migrationBuilder.Sql("INSERT INTO \"Audit\" (\"NewsId\", \"Actor\", \"Action\", \"At\") SELECT \"Id\", 'News category migration', 'category: article → blog', NOW() FROM \"News\" WHERE \"Category\" = 'article'");
        migrationBuilder.Sql("UPDATE \"News\" SET \"Category\" = 'blog', \"Version\" = gen_random_uuid(), \"UpdatedAt\" = NOW() WHERE \"Category\" = 'article'");
        migrationBuilder.DropCheckConstraint("CK_News_Category", "News");
        migrationBuilder.AddCheckConstraint("CK_News_Category", "News", "\"Category\" IN ('news', 'blog')");
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint("CK_News_Category", "News");
        migrationBuilder.AddCheckConstraint("CK_News_Category", "News", "\"Category\" IN ('news', 'article', 'blog')");
        // Do not guess which subsequently edited Blog entries used to be Article.
    }
}
