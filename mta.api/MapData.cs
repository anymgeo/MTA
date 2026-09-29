using System.Text.Json;
namespace Mta.Api;

public class ResortMap
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResortId { get; set; }
    public string ImageUrl { get; set; } = "";
    public int Width { get; set; } = 1600;
    public int Height { get; set; } = 1000;
    public string CoordinateSystem { get; set; } = "image-pixels";
    public bool Placeholder { get; set; } = true;
    public Guid Version { get; set; } = Guid.NewGuid();
}
public class MapArea
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MapId { get; set; }
    public string NameKa { get; set; } = "";
    public string NameEn { get; set; } = "";
    public int SortOrder { get; set; }
}
public class MapFeatureType
{
    public string Key { get; set; } = "";
    public string NameKa { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string GeometryKind { get; set; } = "point";
    public string Icon { get; set; } = "pin";
    public string Color { get; set; } = "#17231f";
    public string[] Statuses { get; set; } = ["active", "resolved"];
    public bool Active { get; set; } = true;
    public Guid Version { get; set; } = Guid.NewGuid();
}
public class MapFeature
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MapId { get; set; }
    public string TypeKey { get; set; } = "";
    public string GeometryKind { get; set; } = "point";
    public string PointsJson { get; set; } = "[]";
    public string NameKa { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string DescriptionKa { get; set; } = "";
    public string DescriptionEn { get; set; } = "";
    public string Status { get; set; } = "unknown";
    public string Difficulty { get; set; } = "";
    public string LiftType { get; set; } = "";
    public string Opens { get; set; } = "";
    public string Closes { get; set; } = "";
    public int? DurationMinutes { get; set; }
    public string ExternalRecordKey { get; set; } = "";
    public string CreatedBy { get; set; } = "";
    public string CreatedByName { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string UpdatedBy { get; set; } = "";
    public string UpdatedByName { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool Deleted { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public double[][] Points => JsonSerializer.Deserialize<double[][]>(PointsJson)!;
}
public class MapFeatureRevision
{
    public long Id { get; set; }
    public Guid MapId { get; set; }
    public Guid? FeatureId { get; set; }
    public string ActorId { get; set; } = "";
    public string ActorName { get; set; } = "";
    public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;
    public string Action { get; set; } = "";
    public string BeforeJson { get; set; } = "null";
    public string AfterJson { get; set; } = "null";
}
