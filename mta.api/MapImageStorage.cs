using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Net.Http.Headers;
namespace Mta.Api;

public static class MapImageStorage
{
    // Read compatibility for pyramids made by the previous .dzi/.jpg naming bug.
    // Only resolve their real derived-file URL; original images/geometry/versions stay untouched.
    public static JsonElement ResolveTiles(string json) {
        var node=JsonNode.Parse(json);
        if(node is JsonObject data&&data["extension"]==null&&data["baseUrl"]?.GetValue<string>() is {} url&&Regex.IsMatch(url,@"^/media/map-[a-f0-9]{32}_files$")){
            data["baseUrl"]=url[..^6]+".dzi_files";data["extension"]="jpeg";
        }
        return JsonSerializer.SerializeToElement(node);
    }
    public static string Root(IConfiguration config,IWebHostEnvironment env)=>Path.GetFullPath(config["StoragePath"]??Path.Combine(env.ContentRootPath,"storage"));
    public static object? Tiles(string imageUrl,IConfiguration config,IWebHostEnvironment env) {
        var path=Path.Combine(Root(config,env),"media",Path.GetFileNameWithoutExtension(imageUrl)+".tiles.json");
        return File.Exists(path)?JsonSerializer.Deserialize<JsonElement>(File.ReadAllText(path)):null;
    }
    public static async Task<string> Worker(string path,string mode,IConfiguration config,IWebHostEnvironment env,CancellationToken cancellation) {
        var start=new ProcessStartInfo(config["MapTiles:NodePath"]??"node") { UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,WorkingDirectory=env.ContentRootPath };
        start.ArgumentList.Add(Path.Combine(env.ContentRootPath,"map-tiles.mjs"));start.ArgumentList.Add(path);start.ArgumentList.Add(mode);
        using var process=Process.Start(start)??throw new InvalidDataException("Could not start map tile processor.");
        var output=process.StandardOutput.ReadToEndAsync(cancellation);var error=process.StandardError.ReadToEndAsync(cancellation);
        try{await process.WaitForExitAsync(cancellation);}catch{if(!process.HasExited)process.Kill(true);throw;}
        var message=await error;if(process.ExitCode!=0)throw new InvalidDataException("Map image processing failed: "+message[..Math.Min(message.Length,600)]);
        return await output;
    }
    // Raw-body upload avoids buffering through FormData/Next. Legacy multipart clients stream too.
    public static async Task<(string Path,MapImageInfo Info)> Store(HttpRequest request,IConfiguration config,IWebHostEnvironment env) {
        var media=Path.Combine(Root(config,env),"media");Directory.CreateDirectory(media);var stem="map-"+Guid.NewGuid().ToString("N");var temp=Path.Combine(media,stem+".upload");
        try{
            await using(var file=new FileStream(temp,FileMode.CreateNew,FileAccess.Write,FileShare.None,65536,FileOptions.Asynchronous|FileOptions.SequentialScan)) {
                if(request.HasFormContentType){var type=MediaTypeHeaderValue.Parse(request.ContentType!);var boundary=HeaderUtilities.RemoveQuotes(type.Boundary).Value??throw new InvalidDataException("Missing multipart boundary.");var reader=new MultipartReader(boundary,request.Body){BodyLengthLimit=null};MultipartSection? part;var found=false;
                    while((part=await reader.ReadNextSectionAsync(request.HttpContext.RequestAborted))!=null){if(ContentDispositionHeaderValue.TryParse(part.ContentDisposition,out var disposition)&&HeaderUtilities.RemoveQuotes(disposition.Name).Value=="file"){await part.Body.CopyToAsync(file,request.HttpContext.RequestAborted);found=true;break;}}
                    if(!found)throw new InvalidDataException("Choose an image file.");
                }else await request.Body.CopyToAsync(file,request.HttpContext.RequestAborted);
            }
            using var info=JsonDocument.Parse(await Worker(temp,"info",config,env,request.HttpContext.RequestAborted));var data=info.RootElement;
            var image=new MapImageInfo(data.GetProperty("width").GetInt32(),data.GetProperty("height").GetInt32(),data.GetProperty("extension").GetString()!);var path=Path.Combine(media,stem+image.Extension);File.Move(temp,path);return(path,image);
        }catch{if(File.Exists(temp))File.Delete(temp);throw;}
    }
}
