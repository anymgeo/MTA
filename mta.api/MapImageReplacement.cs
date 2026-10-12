using System.Text.Json;
namespace Mta.Api;

public record MapAlignment(double ScaleX,double ScaleY,double Rotation,double OffsetX,double OffsetY)
{
    public bool Valid => new[]{ScaleX,ScaleY,Rotation,OffsetX,OffsetY}.All(double.IsFinite) && ScaleX>0 && ScaleY>0;
    public double[] Apply(double x,double y) {
        var angle=Rotation*Math.PI/180;var c=Math.Cos(angle);var s=Math.Sin(angle);
        return [ScaleX*x*c-ScaleY*y*s+OffsetX,ScaleX*x*s+ScaleY*y*c+OffsetY];
    }
    public double[][] Apply(double[][] points)=>points.Select(p=>Enumerable.Range(0,p.Length/2).SelectMany(i=>Apply(p[i*2],p[i*2+1])).ToArray()).ToArray();
}
public record MapReplacementInput(Guid Version,Guid Token,MapAlignment Alignment,bool AlignmentConfirmed);
public record PendingMapImage(Guid Token,Guid MapId,Guid MapVersion,string UserId,string ImageUrl,int Width,int Height,JsonElement Tiles,DateTimeOffset CreatedAt);

// Pending files never overwrite a source. Only the final DB transaction makes them live.
public static class MapImageReplacement
{
    static readonly JsonSerializerOptions Json=new(JsonSerializerDefaults.Web);
    static string Manifest(Guid token,IConfiguration config,IWebHostEnvironment env)=>Path.Combine(MapImageStorage.Root(config,env),"map-replacements",token.ToString("N")+".json");
    public static async Task<PendingMapImage> Prepare(ResortMap map,string path,MapImageInfo info,string userId,IConfiguration config,IWebHostEnvironment env,CancellationToken cancellation) {
        var tiles=JsonSerializer.Deserialize<JsonElement>(await MapImageStorage.Worker(path,"build",config,env,cancellation));
        var pending=new PendingMapImage(Guid.NewGuid(),map.Id,map.Version,userId,"/media/"+Path.GetFileName(path),info.Width,info.Height,tiles,DateTimeOffset.UtcNow);
        var manifest=Manifest(pending.Token,config,env);Directory.CreateDirectory(Path.GetDirectoryName(manifest)!);
        await File.WriteAllTextAsync(manifest+".tmp",JsonSerializer.Serialize(pending,Json),cancellation);File.Move(manifest+".tmp",manifest);
        return pending;
    }
    public static async Task<PendingMapImage?> Read(Guid token,Guid mapId,string userId,IConfiguration config,IWebHostEnvironment env,CancellationToken cancellation) {
        var path=Manifest(token,config,env);if(!File.Exists(path))return null;
        var pending=JsonSerializer.Deserialize<PendingMapImage>(await File.ReadAllTextAsync(path,cancellation),Json);
        return pending?.MapId==mapId&&pending.UserId==userId&&pending.CreatedAt>DateTimeOffset.UtcNow.AddDays(-2)?pending:null;
    }
}
