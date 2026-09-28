using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
namespace Mta.Api.Migrations;
[DbContext(typeof(AppDb))]
[Migration("20260928120000_ResortPageContent")]
public class ResortPageContentMigration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add only new configuration; preserve all existing resort content and page edits.
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "KaJson" = jsonb_set("KaJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/ka","markerX":"48","markerY":"60","social":{"resortFacebook":"https://www.facebook.com/MTA.Bakuriani","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"თბილისი","time":""},{"city":"ბათუმი","time":""},{"city":"ქუთაისი","time":""}]}'::jsonb || COALESCE("KaJson"->'page','{}'::jsonb)) WHERE "Slug" = 'bakuriani';
                """);
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "EnJson" = jsonb_set("EnJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/en","markerX":"48","markerY":"60","social":{"resortFacebook":"https://www.facebook.com/MTA.Bakuriani","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"Tbilisi","time":""},{"city":"Batumi","time":""},{"city":"Kutaisi","time":""}]}'::jsonb || COALESCE("EnJson"->'page','{}'::jsonb)) WHERE "Slug" = 'bakuriani';
                """);
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "KaJson" = jsonb_set("KaJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/ka","markerX":"67","markerY":"31","social":{"resortFacebook":"https://www.facebook.com/M.T.A.Gudauri","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"თბილისი","time":""},{"city":"ბათუმი","time":""},{"city":"ქუთაისი","time":""}]}'::jsonb || COALESCE("KaJson"->'page','{}'::jsonb)) WHERE "Slug" = 'gudauri-kobi';
                """);
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "EnJson" = jsonb_set("EnJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/en","markerX":"67","markerY":"31","social":{"resortFacebook":"https://www.facebook.com/M.T.A.Gudauri","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"Tbilisi","time":""},{"city":"Batumi","time":""},{"city":"Kutaisi","time":""}]}'::jsonb || COALESCE("EnJson"->'page','{}'::jsonb)) WHERE "Slug" = 'gudauri-kobi';
                """);
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "KaJson" = jsonb_set("KaJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/ka","markerX":"32","markerY":"20","social":{"resortFacebook":"https://www.facebook.com/MTA.Mestia","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"თბილისი","time":""},{"city":"ბათუმი","time":""},{"city":"ქუთაისი","time":""}]}'::jsonb || COALESCE("KaJson"->'page','{}'::jsonb)) WHERE "Slug" = 'mestia';
                """);
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "EnJson" = jsonb_set("EnJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/en","markerX":"32","markerY":"20","social":{"resortFacebook":"https://www.facebook.com/MTA.Mestia","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"Tbilisi","time":""},{"city":"Batumi","time":""},{"city":"Kutaisi","time":""}]}'::jsonb || COALESCE("EnJson"->'page','{}'::jsonb)) WHERE "Slug" = 'mestia';
                """);
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "KaJson" = jsonb_set("KaJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/ka","markerX":"27","markerY":"70","social":{"resortFacebook":"https://www.facebook.com/MTA.Goderdzi","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"თბილისი","time":""},{"city":"ბათუმი","time":""},{"city":"ქუთაისი","time":""}]}'::jsonb || COALESCE("KaJson"->'page','{}'::jsonb)) WHERE "Slug" = 'goderdzi';
                """);
            migrationBuilder.Sql("""
                UPDATE "Resorts" SET "EnJson" = jsonb_set("EnJson", '{page}', '{"about":"","history":"","facts":"","arrivalText":"","infrastructureText":"","logoUrl":"","videoUrl":"","pdfUrl":"","bannerImage":"","purchaseUrl":"https://status.mta.ski/en","markerX":"27","markerY":"70","social":{"resortFacebook":"https://www.facebook.com/MTA.Goderdzi","facebook":"https://www.facebook.com/MountainTrailsAgency","instagram":"https://www.instagram.com/m.t.a_mountain_trails_agency/","tiktok":""},"travelTimes":[{"city":"Tbilisi","time":""},{"city":"Batumi","time":""},{"city":"Kutaisi","time":""}]}'::jsonb || COALESCE("EnJson"->'page','{}'::jsonb)) WHERE "Slug" = 'goderdzi';
                """);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally retain editorial content on rollback.
    }
}
