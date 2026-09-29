using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
namespace Mta.Api;

public record MapFeatureInput(Guid MapVersion, Guid? Version, string TypeKey, double[][] Points,
    string NameKa, string NameEn, string DescriptionKa, string DescriptionEn, string Status,
    string Difficulty = "", string LiftType = "", string Opens = "", string Closes = "", int? DurationMinutes = null);
public record MapImageInput(Guid Version, string ImageUrl, int Width, int Height);
public static class MapEditorEndpoints
{
    public static readonly string[] Statuses = ["unknown", "open", "closed", "limited", "operational", "maintenance", "active", "resolved"];
    public static readonly string[] Difficulties = ["easy", "medium", "difficult"];
    public static readonly string[] LiftTypes = ["gondola", "chairlift", "drag-lift", "surface-lift", "magic-carpet"];
    public static readonly int[] Durations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 45, 60];
    public static readonly string[] Times = Enumerable.Range(0, 48).Select(i => $"{i / 2:00}:{i % 2 * 30:00}").ToArray();
    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    static IResult Conflict() => Results.Conflict(new { message = "რუკა სხვა მომხმარებელმა შეცვალა. განაახლეთ რუკა და გადაამოწმეთ ცვლილებები. / This map changed in another session. Reload and review before saving. Your drawing has not been overwritten." });
    static object Feature(MapFeature f) => new { f.Id, f.MapId, f.TypeKey, f.GeometryKind, points = f.Points,
        f.NameKa, f.NameEn, f.DescriptionKa, f.DescriptionEn, f.Status, f.Difficulty, f.LiftType, f.Opens, f.Closes,
        f.DurationMinutes, f.CreatedByName, f.CreatedAt, f.UpdatedByName, f.UpdatedAt, f.Version, f.Deleted };
    static async Task<object> View(ResortMap map, AppDb db) => new { map.Id, map.ResortId, map.ImageUrl, map.Width, map.Height,
        map.CoordinateSystem, map.Placeholder, map.Version, types = await db.MapFeatureTypes.AsNoTracking().OrderBy(t => t.Key).ToListAsync(),
        features = (await db.MapFeatures.AsNoTracking().Where(f => f.MapId == map.Id && !f.Deleted).OrderBy(f => f.CreatedAt).ToListAsync()).Select(Feature) };
    static async Task<(string Id, string Name)> Actor(HttpContext ctx, UserManager<PortalUser> users)
    {
        var user = await users.GetUserAsync(ctx.User);
        return (ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)!, user?.DisplayName ?? user?.Email ?? "Admin");
    }
    static void Revision(AppDb db, Guid mapId, Guid? featureId, string action, (string Id, string Name) actor, object? before, object? after) =>
        db.MapFeatureRevisions.Add(new() { MapId = mapId, FeatureId = featureId, Action = action,
            ActorId = actor.Id, ActorName = actor.Name, BeforeJson = JsonSerializer.Serialize(before, Json), AfterJson = JsonSerializer.Serialize(after, Json) });
    public static void MapMapEditor(this WebApplication app, RouteGroupBuilder admin)
    {
        admin.MapGet("/map-options", () => new { times = Times, durations = Durations, difficulties = Difficulties, liftTypes = LiftTypes, statuses = Statuses });
        admin.MapGet("/resorts/{resortId:guid}/map", async (Guid resortId, AppDb db) => {
            var map = await db.ResortMaps.SingleOrDefaultAsync(m => m.ResortId == resortId);
            return map == null ? Results.NotFound() : Results.Ok(await View(map, db));
        });
        admin.MapPut("/maps/{mapId:guid}/image", async (Guid mapId, MapImageInput input, AppDb db, HttpContext ctx, UserManager<PortalUser> users, IConfiguration config, IWebHostEnvironment environment) => {
            var map = await db.ResortMaps.FindAsync(mapId); if (map == null) return Results.NotFound();
            if (map.Version != input.Version) return Conflict();
            // Only images verified by the map upload endpoint can become a reference image.
            if (!Regex.IsMatch(input.ImageUrl ?? "", @"^/media/map-[a-f0-9]{32}\.(png|jpg|webp)$")) return Results.BadRequest();
            var storage = Path.GetFullPath(config["StoragePath"] ?? Path.Combine(environment.ContentRootPath, "storage"));
            var path = Path.Combine(storage, "media", Path.GetFileName(input.ImageUrl!));
            if (!File.Exists(path)) return Results.BadRequest();
            using var imageStream = File.OpenRead(path);
            var info = MapImageInfo.Read(imageStream);
            if (info.Width != input.Width || info.Height != input.Height || info.Width > 16000 || info.Height > 16000) return Results.BadRequest();
            // A different reference size cannot silently invalidate existing coordinates.
            if (await db.MapFeatures.AnyAsync(f => f.MapId == mapId) && (map.Width != info.Width || map.Height != info.Height))
                return Results.BadRequest(new { message = "Use an image with the same reference dimensions while map features exist. / შეინარჩუნეთ რუკის არსებული ზომები." });
            var before = new { map.ImageUrl, map.Width, map.Height };
            map.ImageUrl = input.ImageUrl!; map.Width = info.Width; map.Height = info.Height; map.Placeholder = false; map.Version = Guid.NewGuid();
            Revision(db, mapId, null, "image", await Actor(ctx, users), before, new { map.ImageUrl, map.Width, map.Height });
            try { await db.SaveChangesAsync(); return Results.Ok(await View(map, db)); } catch (DbUpdateConcurrencyException) { return Conflict(); }
        }).RequireAuthorization("SuperAdmin");
        admin.MapPost("/map-image", async (HttpRequest request, IConfiguration config, IWebHostEnvironment environment) => {
            if (!request.HasFormContentType) return Results.BadRequest();
            var file = (await request.ReadFormAsync()).Files.GetFile("file");
            if (file == null || file.Length < 12 || file.Length > 5 * 1024 * 1024) return Results.BadRequest(new { message = "PNG/JPG/WebP, maximum 5 MB." });
            await using var source = file.OpenReadStream();
            await using var stream = new MemoryStream();
            await source.CopyToAsync(stream); stream.Position = 0;
            try {
                var info = MapImageInfo.Read(stream);
                var extension = info.Extension;
                if (extension == null || info.Width > 16000 || info.Height > 16000 || (long)info.Width * info.Height > 64000000) return Results.BadRequest();
                var storage = Path.GetFullPath(config["StoragePath"] ?? Path.Combine(environment.ContentRootPath, "storage"));
                var name = "map-" + Guid.NewGuid().ToString("N") + extension;
                stream.Position = 0;
                await using var output = File.Create(Path.Combine(storage, "media", name)); await stream.CopyToAsync(output);
                return Results.Ok(new { imageUrl = "/media/" + name, width = info.Width, height = info.Height });
            } catch (InvalidDataException) { return Results.BadRequest(); }
        }).RequireAuthorization("SuperAdmin");
        admin.MapPost("/maps/{mapId:guid}/features", (Guid mapId, MapFeatureInput input, AppDb db, HttpContext ctx, UserManager<PortalUser> users) => SaveFeature(mapId, null, input, db, ctx, users));
        admin.MapPut("/maps/{mapId:guid}/features/{id:guid}", (Guid mapId, Guid id, MapFeatureInput input, AppDb db, HttpContext ctx, UserManager<PortalUser> users) => SaveFeature(mapId, id, input, db, ctx, users));
        admin.MapDelete("/maps/{mapId:guid}/features/{id:guid}", async (Guid mapId, Guid id, Guid mapVersion, Guid version, AppDb db, HttpContext ctx, UserManager<PortalUser> users) => {
            var map = await db.ResortMaps.FindAsync(mapId); var f = await db.MapFeatures.SingleOrDefaultAsync(f => f.Id == id && f.MapId == mapId && !f.Deleted);
            if (map == null || f == null) return Results.NotFound();
            if (map.Version != mapVersion || f.Version != version) return Conflict();
            var before = Feature(f); var actor = await Actor(ctx, users);
            f.Deleted = true; f.Version = Guid.NewGuid(); f.UpdatedAt = DateTimeOffset.UtcNow; f.UpdatedBy = actor.Id; f.UpdatedByName = actor.Name; map.Version = Guid.NewGuid();
            Revision(db, mapId, id, "delete", actor, before, Feature(f));
            try { await db.SaveChangesAsync(); return Results.Ok(await View(map, db)); } catch (DbUpdateConcurrencyException) { return Conflict(); }
        }).RequireAuthorization("SuperAdmin");
        admin.MapGet("/maps/{mapId:guid}/history", async (Guid mapId, Guid? featureId, AppDb db) =>
            await db.MapFeatureRevisions.AsNoTracking().Where(r => r.MapId == mapId && (featureId == null || r.FeatureId == featureId))
                .OrderByDescending(r => r.Id).Take(200).ToListAsync());
        admin.MapPost("/map-types", async (MapFeatureType input, AppDb db) => {
            if (!ValidType(input) || await db.MapFeatureTypes.AnyAsync(t => t.Key == input.Key)) return Results.BadRequest();
            input.Version = Guid.NewGuid(); db.MapFeatureTypes.Add(input); await db.SaveChangesAsync(); return Results.Ok(input);
        }).RequireAuthorization("SuperAdmin");
        app.MapGet("/api/maps/{slug}", async (string slug, string? locale, AppDb db, HttpContext ctx) => {
            if (locale is not (null or "en" or "ka")) return Results.BadRequest();
            ctx.Response.Headers.CacheControl = "no-store";
            var resort = await db.Resorts.AsNoTracking().SingleOrDefaultAsync(r => r.Slug == slug); if (resort == null) return Results.NotFound();
            var map = await db.ResortMaps.AsNoTracking().SingleOrDefaultAsync(m => m.ResortId == resort.Id); if (map == null) return Results.NotFound();
            var types = await db.MapFeatureTypes.AsNoTracking().ToListAsync();
            var features = await db.MapFeatures.AsNoTracking().Where(f => f.MapId == map.Id && !f.Deleted).OrderBy(f => f.CreatedAt).ToListAsync();
            return Results.Ok(new { id = slug, mapId = map.Id, image = map.ImageUrl, map.Width, map.Height, map.Version, map.Placeholder, managed = true,
                coordinateSystem = map.CoordinateSystem, verified = !map.Placeholder, demo = false,
                types = types.Where(t => features.Any(f => f.TypeKey == t.Key)).Select(t => new { t.Key, name = locale == "en" ? t.NameEn : t.NameKa, t.Icon, t.Color, t.GeometryKind }),
                features = features.Select(f => new { f.Id, kind = f.TypeKey, f.GeometryKind, points = f.Points,
                    name = locale == "en" ? f.NameEn : f.NameKa, description = locale == "en" ? f.DescriptionEn : f.DescriptionKa,
                    f.Status, f.Difficulty, f.LiftType, f.Opens, f.Closes, f.DurationMinutes, f.UpdatedAt }) });
        });
    }
    static bool ValidType(MapFeatureType t) => Regex.IsMatch(t.Key ?? "", "^[a-z][a-z0-9-]{1,39}$") &&
        !string.IsNullOrWhiteSpace(t.NameKa) && t.NameKa.Length <= 120 && !string.IsNullOrWhiteSpace(t.NameEn) && t.NameEn.Length <= 120 &&
        t.GeometryKind is "point" or "line" or "polygon" && new[] { "pin", "trail", "lift", "warning" }.Contains(t.Icon) &&
        Regex.IsMatch(t.Color ?? "", "^#[a-fA-F0-9]{6}$") && t.Statuses is { Length: > 0 and <= 8 } && t.Statuses.All(Statuses.Contains);
    static async Task<IResult> SaveFeature(Guid mapId, Guid? id, MapFeatureInput input, AppDb db, HttpContext ctx, UserManager<PortalUser> users)
    {
        var map = await db.ResortMaps.FindAsync(mapId); if (map == null) return Results.NotFound();
        if (map.Version != input.MapVersion) return Conflict();
        var type = await db.MapFeatureTypes.FindAsync(input.TypeKey); if (type == null || !type.Active) return Results.BadRequest();
        var minimum = type.GeometryKind == "point" ? 1 : type.GeometryKind == "polygon" ? 3 : 2;
        if (input.Points == null || input.Points.Length < minimum || input.Points.Length > 2000 || (type.GeometryKind == "point" && input.Points.Length != 1) ||
            input.Points.Any(p => p == null || (p.Length != 2 && p.Length != 6) || p.Any(v => !double.IsFinite(v)) ||
                p.Where((_, index) => index % 2 == 0).Any(v => v < 0 || v > map.Width) ||
                p.Where((_, index) => index % 2 == 1).Any(v => v < 0 || v > map.Height)) ||
            input.Points.Select(p => (p[0], p[1])).Distinct().Count() < minimum)
            return Results.BadRequest(new { message = $"At least {minimum} distinct points within the map are required. / საჭიროა მინიმუმ {minimum} განსხვავებული წერტილი." });
        if (string.IsNullOrWhiteSpace(input.NameKa) || string.IsNullOrWhiteSpace(input.NameEn) || input.NameKa.Length > 200 || input.NameEn.Length > 200 ||
            input.DescriptionKa == null || input.DescriptionEn == null || input.DescriptionKa.Length > 5000 || input.DescriptionEn.Length > 5000 || !type.Statuses.Contains(input.Status) ||
            (input.TypeKey == "trail" ? !Difficulties.Contains(input.Difficulty) : !string.IsNullOrEmpty(input.Difficulty)) ||
            (input.TypeKey == "lift" ? !LiftTypes.Contains(input.LiftType) : !string.IsNullOrEmpty(input.LiftType)) ||
            (!string.IsNullOrEmpty(input.Opens) && !Times.Contains(input.Opens)) || (!string.IsNullOrEmpty(input.Closes) && !Times.Contains(input.Closes)) ||
            (string.IsNullOrEmpty(input.Opens) != string.IsNullOrEmpty(input.Closes)) ||
            (input.DurationMinutes.HasValue && !Durations.Contains(input.DurationMinutes.Value)) ||
            (input.TypeKey != "lift" && (input.DurationMinutes.HasValue || !string.IsNullOrEmpty(input.Opens) || !string.IsNullOrEmpty(input.Closes))))
            return Results.BadRequest(new { message = "Check both names and select valid difficulty, lift type, status and time options. / გადაამოწმეთ ორივე ენა და აირჩიეთ მოქმედი მნიშვნელობები." });
        var f = id.HasValue ? await db.MapFeatures.SingleOrDefaultAsync(f => f.Id == id && f.MapId == mapId && !f.Deleted) : new MapFeature { MapId = mapId };
        if (f == null) return Results.NotFound();
        if (id.HasValue && f.Version != input.Version) return Conflict();
        var before = id.HasValue ? Feature(f) : null;
        var actor = await Actor(ctx, users);
        if (!id.HasValue) { f.CreatedBy = actor.Id; f.CreatedByName = actor.Name; db.MapFeatures.Add(f); }
        f.TypeKey = input.TypeKey; f.GeometryKind = type.GeometryKind; f.PointsJson = JsonSerializer.Serialize(input.Points);
        f.NameKa = input.NameKa.Trim(); f.NameEn = input.NameEn.Trim(); f.DescriptionKa = input.DescriptionKa.Trim(); f.DescriptionEn = input.DescriptionEn.Trim();
        f.Status = input.Status; f.Difficulty = input.Difficulty; f.LiftType = input.LiftType; f.Opens = input.Opens; f.Closes = input.Closes; f.DurationMinutes = input.DurationMinutes;
        f.UpdatedAt = DateTimeOffset.UtcNow; f.UpdatedBy = actor.Id; f.UpdatedByName = actor.Name; f.Version = Guid.NewGuid(); map.Version = Guid.NewGuid();
        Revision(db, mapId, f.Id, id.HasValue ? "edit" : "create", actor, before, Feature(f));
        try { await db.SaveChangesAsync(); return Results.Ok(await View(map, db)); } catch (DbUpdateConcurrencyException) { return Conflict(); }
    }
}
