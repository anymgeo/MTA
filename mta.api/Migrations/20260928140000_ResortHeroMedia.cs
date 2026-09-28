using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
namespace Mta.Api.Migrations;
[DbContext(typeof(AppDb))]
[Migration("20260928140000_ResortHeroMedia")]
public class ResortHeroMedia : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var column in new[] { "EnJson", "KaJson" })
        {
            // Fill empty media only. Existing custom uploads and editorial content are retained.
            migrationBuilder.Sql($$"""
                UPDATE "Resorts" SET "{{column}}" = jsonb_set("{{column}}", '{page}',
                  COALESCE("{{column}}"->'page', '{}'::jsonb) || jsonb_build_object(
                    'videoUrl', COALESCE(NULLIF("{{column}}"#>>'{page,videoUrl}',''), '/videos/' || CASE WHEN "Slug" = 'gudauri-kobi' THEN 'gudauri' ELSE "Slug" END || '.mp4'),
                    'posterUrl', COALESCE(NULLIF("{{column}}"#>>'{page,posterUrl}',''), '/videos/' || CASE WHEN "Slug" = 'gudauri-kobi' THEN 'gudauri' ELSE "Slug" END || '-poster.jpg'),
                    'videoWebmUrl', COALESCE("{{column}}"#>>'{page,videoWebmUrl}','')))
                WHERE "Slug" IN ('bakuriani','gudauri-kobi','mestia','goderdzi');
                """);
        }
    }
    protected override void Down(MigrationBuilder migrationBuilder) { /* Keep uploaded/editorial media references. */ }
}
