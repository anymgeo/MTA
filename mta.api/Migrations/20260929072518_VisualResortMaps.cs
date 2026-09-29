using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Mta.Api.Migrations
{
    /// <inheritdoc />
    public partial class VisualResortMaps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MapFeatureRevisions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MapId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeatureId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorId = table.Column<string>(type: "text", nullable: false),
                    ActorName = table.Column<string>(type: "text", nullable: false),
                    At = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    BeforeJson = table.Column<string>(type: "jsonb", nullable: false),
                    AfterJson = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapFeatureRevisions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MapFeatureTypes",
                columns: table => new
                {
                    Key = table.Column<string>(type: "text", nullable: false),
                    NameKa = table.Column<string>(type: "text", nullable: false),
                    NameEn = table.Column<string>(type: "text", nullable: false),
                    GeometryKind = table.Column<string>(type: "text", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: false),
                    Color = table.Column<string>(type: "text", nullable: false),
                    Statuses = table.Column<string[]>(type: "text[]", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapFeatureTypes", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "ResortMaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResortId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: false),
                    Height = table.Column<int>(type: "integer", nullable: false),
                    CoordinateSystem = table.Column<string>(type: "text", nullable: false),
                    Placeholder = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResortMaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResortMaps_Resorts_ResortId",
                        column: x => x.ResortId,
                        principalTable: "Resorts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MapAreas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MapId = table.Column<Guid>(type: "uuid", nullable: false),
                    NameKa = table.Column<string>(type: "text", nullable: false),
                    NameEn = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapAreas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapAreas_ResortMaps_MapId",
                        column: x => x.MapId,
                        principalTable: "ResortMaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MapFeatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MapId = table.Column<Guid>(type: "uuid", nullable: false),
                    TypeKey = table.Column<string>(type: "text", nullable: false),
                    GeometryKind = table.Column<string>(type: "text", nullable: false),
                    PointsJson = table.Column<string>(type: "jsonb", nullable: false),
                    NameKa = table.Column<string>(type: "text", nullable: false),
                    NameEn = table.Column<string>(type: "text", nullable: false),
                    DescriptionKa = table.Column<string>(type: "text", nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Difficulty = table.Column<string>(type: "text", nullable: false),
                    LiftType = table.Column<string>(type: "text", nullable: false),
                    Opens = table.Column<string>(type: "text", nullable: false),
                    Closes = table.Column<string>(type: "text", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    ExternalRecordKey = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedByName = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedByName = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapFeatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapFeatures_MapFeatureTypes_TypeKey",
                        column: x => x.TypeKey,
                        principalTable: "MapFeatureTypes",
                        principalColumn: "Key",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MapFeatures_ResortMaps_MapId",
                        column: x => x.MapId,
                        principalTable: "ResortMaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MapAreas_MapId",
                table: "MapAreas",
                column: "MapId");

            migrationBuilder.CreateIndex(
                name: "IX_MapFeatureRevisions_MapId_At",
                table: "MapFeatureRevisions",
                columns: new[] { "MapId", "At" });

            migrationBuilder.CreateIndex(
                name: "IX_MapFeatures_MapId_Deleted",
                table: "MapFeatures",
                columns: new[] { "MapId", "Deleted" });

            migrationBuilder.CreateIndex(
                name: "IX_MapFeatures_TypeKey",
                table: "MapFeatures",
                column: "TypeKey");

            migrationBuilder.CreateIndex(
                name: "IX_ResortMaps_ResortId",
                table: "ResortMaps",
                column: "ResortId",
                unique: true);

            // Stable built-in tools and one fixed-size canvas per existing resort.
            // Existing public assets remain in place; later uploads replace only ImageUrl.
            migrationBuilder.Sql("""
                INSERT INTO "MapFeatureTypes" ("Key","NameKa","NameEn","GeometryKind","Icon","Color","Statuses","Active","Version") VALUES
                ('trail','ტრასა','Trail','line','trail','#168354',ARRAY['unknown','open','closed','limited'],TRUE,'30000000-0000-0000-0000-000000000001'::uuid),
                ('lift','საბაგირო','Lift','line','lift','#246ac1',ARRAY['unknown','operational','closed','maintenance'],TRUE,'30000000-0000-0000-0000-000000000002'::uuid),
                ('warning','გაფრთხილება','Warning','point','warning','#d73b32',ARRAY['active','resolved'],TRUE,'30000000-0000-0000-0000-000000000003'::uuid);

                INSERT INTO "ResortMaps" ("Id","ResortId","ImageUrl","Width","Height","CoordinateSystem","Placeholder","Version")
                SELECT '10000000-0000-0000-0000-000000000001'::uuid, "Id", '/Bakuriani.jpg', 7952, 5304, 'image-pixels', TRUE, '20000000-0000-0000-0000-000000000001'::uuid FROM "Resorts" WHERE "Slug"='bakuriani'
                UNION ALL SELECT '10000000-0000-0000-0000-000000000002'::uuid, "Id", '/maps/gudauri-clean.png', 1183, 1330, 'image-pixels', TRUE, '20000000-0000-0000-0000-000000000002'::uuid FROM "Resorts" WHERE "Slug"='gudauri-kobi'
                UNION ALL SELECT '10000000-0000-0000-0000-000000000003'::uuid, "Id", '/MESTIA.webp', 970, 620, 'image-pixels', TRUE, '20000000-0000-0000-0000-000000000003'::uuid FROM "Resorts" WHERE "Slug"='mestia'
                UNION ALL SELECT '10000000-0000-0000-0000-000000000004'::uuid, "Id", '/maps/goderdzi-live-reference.jpg', 1961, 1455, 'image-pixels', TRUE, '20000000-0000-0000-0000-000000000004'::uuid FROM "Resorts" WHERE "Slug"='goderdzi';

                INSERT INTO "MapFeatures" ("Id","MapId","TypeKey","GeometryKind","PointsJson","NameKa","NameEn","DescriptionKa","DescriptionEn","Status","Difficulty","LiftType","Opens","Closes","DurationMinutes","ExternalRecordKey","CreatedBy","CreatedByName","CreatedAt","UpdatedBy","UpdatedByName","UpdatedAt","Deleted","Version") VALUES
                ('40000000-0000-0000-0000-000000000001'::uuid,'10000000-0000-0000-0000-000000000004'::uuid,'lift','line','[[1048,1120],[1090,1048],[1188,875],[1290,694],[1404,524]]','ზანკა','Zanka','','','unknown','','chairlift','','',NULL,'goderdzi-lift-1','migration','System migration',NOW(),'migration','System migration',NOW(),FALSE,'50000000-0000-0000-0000-000000000001'::uuid),
                ('40000000-0000-0000-0000-000000000002'::uuid,'10000000-0000-0000-0000-000000000004'::uuid,'lift','line','[[1404,524],[1412,450],[1424,292],[1436,154]]','ჭანჭახი','Chanchakhi','','','unknown','','chairlift','','',NULL,'goderdzi-lift-2','migration','System migration',NOW(),'migration','System migration',NOW(),FALSE,'50000000-0000-0000-0000-000000000002'::uuid),
                ('40000000-0000-0000-0000-000000000003'::uuid,'10000000-0000-0000-0000-000000000004'::uuid,'trail','line','[[1404,524],[1392,757],[1431,1040],[1307,1129],[1087,1196]]','ზანკა','Zanka','','','unknown','medium','','','',NULL,'goderdzi-trail-1','migration','System migration',NOW(),'migration','System migration',NOW(),FALSE,'50000000-0000-0000-0000-000000000003'::uuid),
                ('40000000-0000-0000-0000-000000000004'::uuid,'10000000-0000-0000-0000-000000000004'::uuid,'trail','line','[[1436,154],[1399,373],[1404,524]]','იაილა','Yaila','','','unknown','difficult','','','',NULL,'goderdzi-trail-2','migration','System migration',NOW(),'migration','System migration',NOW(),FALSE,'50000000-0000-0000-0000-000000000004'::uuid);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MapAreas");

            migrationBuilder.DropTable(
                name: "MapFeatureRevisions");

            migrationBuilder.DropTable(
                name: "MapFeatures");

            migrationBuilder.DropTable(
                name: "MapFeatureTypes");

            migrationBuilder.DropTable(
                name: "ResortMaps");
        }
    }
}
