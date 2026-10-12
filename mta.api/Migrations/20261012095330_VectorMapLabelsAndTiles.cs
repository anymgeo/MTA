using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace Mta.Api.Migrations;
public partial class VectorMapLabelsAndTiles:Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name:"TilesJson",table:"ResortMaps",type:"jsonb",nullable:false,defaultValue:"null");
        migrationBuilder.AddColumn<string>(name:"AnchorModesJson",table:"MapFeatures",type:"jsonb",nullable:false,defaultValue:"[]");
        migrationBuilder.AddColumn<string>(name:"LabelJson",table:"MapFeatures",type:"jsonb",nullable:false,defaultValue:"null");
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name:"TilesJson",table:"ResortMaps");
        migrationBuilder.DropColumn(name:"AnchorModesJson",table:"MapFeatures");
        migrationBuilder.DropColumn(name:"LabelJson",table:"MapFeatures");
    }
}
