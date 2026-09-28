using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Mta.Api;

public class Resort
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = "";
    public string Status { get; set; } = "CLOSED";
    public string KaJson { get; set; } = "{}";
    public string EnJson { get; set; } = "{}";
    public Guid Version { get; set; } = Guid.NewGuid();
    public object View(bool liveManaged = false) => new { Id, Slug, Status, Version, liveManaged, ka = JsonNode.Parse(KaJson), en = JsonNode.Parse(EnJson) };
    public JsonObject Localized(string locale)
    {
        var result = JsonNode.Parse(locale == "en" ? EnJson : KaJson)!.AsObject();
        result["id"] = Id.ToString(); result["slug"] = Slug; result["status"] = Status;
        return result;
    }
}

public record ResortInput(string? Slug, string? Status, JsonElement Ka, JsonElement En, Guid? Version)
{
    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>();
        if (Slug == null || Slug.Length > 150 || !Regex.IsMatch(Slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors["slug"] = ["მისამართისთვის გამოიყენეთ ლათინური ასოები, ციფრები და ტირე."];
        if (Status is not ("OPEN" or "LIMITED" or "CLOSED")) errors["status"] = ["აირჩიეთ კურორტის სტატუსი."];
        foreach (var (language, data) in new[] { ("ka", Ka), ("en", En) }) {
            if (!ValidContent(data)) errors[language] = ["ორივე ენაზე შეავსეთ სახელი, რეგიონი, აღწერა და ფოტოები. შეამოწმეთ კურორტის ველები."];
        }
        return errors;
    }
    static bool Image(string? path) => path != null && path.Length <= 250 && Regex.IsMatch(path, @"^/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$", RegexOptions.IgnoreCase);
    static bool String(JsonElement v, int max = 20000) => v.ValueKind == JsonValueKind.String && v.GetString()!.Length <= max;
    static bool Field(JsonElement obj, string key, bool required = false) => obj.TryGetProperty(key, out var v) && String(v) && (!required || !string.IsNullOrWhiteSpace(v.GetString()));
    static bool Array(JsonElement obj, string key, Func<JsonElement, bool> predicate, int max = 100) => obj.TryGetProperty(key, out var a) && a.ValueKind == JsonValueKind.Array && a.GetArrayLength() <= max && a.EnumerateArray().All(predicate);
    static bool ObjectFields(JsonElement obj, params string[] fields) => obj.ValueKind == JsonValueKind.Object && fields.All(f => Field(obj, f));
    static bool ValidContent(JsonElement data)
    {
        if (data.ValueKind != JsonValueKind.Object || data.GetRawText().Length > 200000) return false;
        if (data.TryGetProperty("page", out var page) && !ResortPageContent.Valid(page)) return false;
        if (!new[] { "name", "region", "description" }.All(f => Field(data, f, true))) return false;
        if (!new[] { "image", "summerImage" }.All(f => Field(data, f) && Image(data.GetProperty(f).GetString()))) return false;
        if (!new[] { "lifts", "trails", "temp", "snow", "newSnow", "wind", "hours", "elevation", "highestPoint", "pistes", "winterSeason" }.All(f => Field(data, f))) return false;
        if (!Array(data, "heroImages", p => String(p) && Image(p.GetString()), 12) || !Array(data, "gallery", p => String(p) && Image(p.GetString()), 12)) return false;
        if (!Array(data, "liftList", p => ObjectFields(p, "name", "type", "hours"))) return false;
        if (!Array(data, "trailDifficulty", p => ObjectFields(p, "label", "description") && p.TryGetProperty("value", out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var d) && d >= 0 && d <= 100)) return false;
        if (!data.TryGetProperty("experience", out var experience) || experience.ValueKind != JsonValueKind.Object || !new[] { "winter", "summer" }.All(s => Array(experience, s, p => ObjectFields(p, "title", "text", "iconKey")))) return false;
        if (!data.TryGetProperty("transport", out var transport) || !ObjectFields(transport, "car", "transfer", "routeUrl")) return false;
        var url = transport.GetProperty("routeUrl").GetString();
        if (!string.IsNullOrEmpty(url) && (!Uri.TryCreate(url, UriKind.Absolute, out var parsed) || parsed.Scheme is not ("http" or "https"))) return false;
        if (data.TryGetProperty("seasons", out var seasons)) {
            if (seasons.ValueKind != JsonValueKind.Object) return false;
            foreach (var season in new[] { "winter", "summer" }) {
                if (!seasons.TryGetProperty(season, out var media) || media.ValueKind != JsonValueKind.Object || !Field(media, "image") || !Image(media.GetProperty("image").GetString()) || !Array(media, "heroImages", p => String(p) && Image(p.GetString()), 12) || media.GetProperty("heroImages").GetArrayLength() == 0) return false;
            }
        }
        if (data.TryGetProperty("liveCard", out var card)) {
            if (card.ValueKind != JsonValueKind.Object) return false;
            foreach (var field in new[] { "winterImage", "summerImage" })
                if (card.TryGetProperty(field, out var image) && (!String(image, 250) || (image.GetString() != "" && !Image(image.GetString())))) return false;
            foreach (var field in new[] { "imageAlt", "note" })
                if (card.TryGetProperty(field, out var text) && !String(text, 400)) return false;
            foreach (var field in new[] { "featured", "homepageVisible" })
                if (card.TryGetProperty(field, out var flag) && flag.ValueKind is not (JsonValueKind.True or JsonValueKind.False)) return false;
            if (card.TryGetProperty("displayOrder", out var order) && (order.ValueKind != JsonValueKind.Number || !order.TryGetInt32(out var number) || number < 0 || number > 999)) return false;
        }
        return true;
    }
    public void Apply(Resort resort, bool liveManaged = false)
    {
        resort.Slug = Slug!;
        if (!liveManaged) resort.Status = Status!;
        string Content(JsonElement submitted, string previous) {
            var next = JsonNode.Parse(submitted.GetRawText())!.AsObject();
            var previousContent = JsonNode.Parse(previous)!.AsObject();
            if (!next.ContainsKey("page") && previousContent.ContainsKey("page"))
                next["page"] = previousContent["page"]?.DeepClone();
            next.Remove("liveConditions"); // Operational observations cannot be submitted through CMS.
            if (liveManaged) {
                var old = JsonNode.Parse(previous)!.AsObject();
                foreach (var key in new[] { "lifts", "trails", "temp", "snow", "newSnow", "wind", "hours", "lastUpdatedAt" })
                    next[key] = old[key]?.DeepClone() ?? JsonValue.Create("—");
            }
            return next.ToJsonString();
        }
        resort.KaJson = Content(Ka, resort.KaJson); resort.EnJson = Content(En, resort.EnJson); resort.Version = Guid.NewGuid();
    }
}

public static class ResortEndpoints
{
    public static void MapResorts(this WebApplication app, RouteGroupBuilder admin)
    {
        app.MapGet("/api/resorts/conditions", async (AppDb db, ILiveConditionsProvider provider, HttpContext ctx, ILogger<UnavailableLiveConditionsProvider> logger) => {
            ctx.Response.Headers.CacheControl = "no-store";
            var resorts = await db.Resorts.AsNoTracking().Select(r => new { r.Id, r.Slug }).ToListAsync(ctx.RequestAborted);
            return Results.Ok(await Task.WhenAll(resorts.Select(async r => {
                try {
                    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ctx.RequestAborted);
                    timeout.CancelAfter(TimeSpan.FromSeconds(5));
                    return await provider.GetAsync(r.Id, r.Slug, timeout.Token).WaitAsync(timeout.Token);
                }
                catch (Exception e) when (!ctx.RequestAborted.IsCancellationRequested) {
                    logger.LogWarning(e, "Conditions unavailable for {Resort}", r.Slug);
                    return new LiveResortConditions(r.Id);
                }
            })));
        });
        app.MapGet("/api/resorts", async (string? locale, AppDb db, HttpContext ctx) => {
            if (locale != null && locale is not ("ka" or "en")) return Results.BadRequest();
            ctx.Response.Headers.CacheControl = "no-store";
            return Results.Ok((await db.Resorts.AsNoTracking().OrderBy(r => r.Slug).ToListAsync()).Select(r => r.Localized(locale ?? "ka")));
        });
        admin.MapGet("/resorts", async (AppDb db, ILiveConditionsProvider provider) => Results.Ok((await db.Resorts.AsNoTracking().OrderBy(r => r.Slug).ToListAsync()).Select(r => r.View(provider.IsActive))));
        admin.MapPost("/resorts", async (ResortInput input, AppDb db, HttpContext ctx, ILiveConditionsProvider provider) => {
            var errors = input.Validate(); if (errors.Count > 0) return Results.ValidationProblem(errors);
            var item = new Resort(); input.Apply(item, provider.IsActive); db.Resorts.Add(item);
            Log(db, ctx, "resort-create", item.Id);
            return await Save(db) ? Results.Created($"/api/admin/resorts/{item.Id}", item.View()) : Conflict();
        });
        admin.MapPut("/resorts/{id:guid}", async (Guid id, ResortInput input, AppDb db, HttpContext ctx, ILiveConditionsProvider provider) => {
            var errors = input.Validate(); if (errors.Count > 0) return Results.ValidationProblem(errors);
            var item = await db.Resorts.FindAsync(id); if (item == null) return Results.NotFound();
            if (item.Version != input.Version) return Conflict();
            if (item.Slug != input.Slug) return Results.BadRequest(new { message = "ბმულის დაბოლოება შენახვის შემდეგ უცვლელია." });
            input.Apply(item, provider.IsActive); Log(db, ctx, "resort-update", id);
            return await Save(db) ? Results.Ok(item.View()) : Conflict();
        });
        admin.MapDelete("/resorts/{id:guid}", async (Guid id, Guid version, AppDb db, HttpContext ctx) => {
            var item = await db.Resorts.FindAsync(id); if (item == null) return Results.NotFound();
            if (item.Version != version) return Conflict();
            db.Resorts.Remove(item); Log(db, ctx, "resort-delete", id);
            return await Save(db) ? Results.NoContent() : Conflict();
        });
    }
    static void Log(AppDb db, HttpContext ctx, string action, Guid id) => db.Audit.Add(new AuditEntry { Action = action, NewsId = id, Actor = ctx.User.Identity?.Name ?? "unknown" });
    static IResult Conflict() => Results.Conflict(new { message = "მისამართი უკვე გამოიყენება ან კურორტი სხვა სესიიდან შეიცვალა. განაახლეთ სია." });
    static async Task<bool> Save(AppDb db) {
        try { await db.SaveChangesAsync(); return true; }
        catch (DbUpdateConcurrencyException) { return false; }
        catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: "23505" }) { return false; }
    }
}
