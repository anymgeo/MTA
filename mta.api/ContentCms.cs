using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace Mta.Api;

public class ContentRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Module { get; set; } = "";
    public string Slug { get; set; } = "";
    public string KaJson { get; set; } = "{}";
    public string EnJson { get; set; } = "{}";
    public int SortOrder { get; set; }
    public bool Published { get; set; }
    public bool Deleted { get; set; }
    public string CreatedBy { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string UpdatedBy { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid Version { get; set; } = Guid.NewGuid();
    public JsonObject Localized(string locale) {
        var data = JsonNode.Parse(locale == "en" ? EnJson : KaJson)!.AsObject();
        data["id"] = Id.ToString(); data["slug"] = Slug; data["sortOrder"] = SortOrder;
        return data;
    }
}
public class ContentRevision
{
    public long Id { get; set; }
    public Guid RecordId { get; set; }
    public string Module { get; set; } = "";
    public string Actor { get; set; } = "";
    public string ActorId { get; set; } = "";
    public string Action { get; set; } = "";
    public string BeforeJson { get; set; } = "null";
    public string AfterJson { get; set; } = "null";
    public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;
}
public class ContactMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Message { get; set; } = "";
    public bool Read { get; set; }
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
}
public record ContentInput(string Slug, JsonObject Ka, JsonObject En, int SortOrder, bool Published, Guid? Version);
public record ReadMessage(bool Read);
public record OrderItem(Guid Id, Guid Version);
public record MessageInput(string FirstName, string? LastName, string Email, string? Phone, string Subject, string Message, string? Website);

public static class ContentCms
{
    public static readonly string[] Modules = ["leadership", "events", "contact", "about", "history", "infrastructure", "documents", "safety", "contacts", "webcams", "projects", "structure", "navigation", "home-navigation", "footer", "page-text"];
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static string Snapshot(ContentRecord? r) => JsonSerializer.Serialize(r, Json);
    private static void Audit(AppDb db, HttpContext ctx, ContentRecord r, string action, string before) => db.ContentRevisions.Add(new() {
        RecordId = r.Id, Module = r.Module, Action = action, Actor = ctx.User.Identity?.Name ?? "unknown",
        ActorId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown", BeforeJson = before, AfterJson = Snapshot(r)
    });
    public static async Task SeedAsync(AppDb db, string root) {
        if (await db.Bootstrap.AnyAsync(x => x.Id == "content-cms-v4")) return;
        var rows = JsonSerializer.Deserialize<List<ContentRecord>>(await File.ReadAllTextAsync(Path.Combine(root, "seed-content.json")), Json)!;
        foreach (var row in rows) {
            var existing = await db.ContentRecords.SingleOrDefaultAsync(x => x.Module == row.Module && x.Slug == row.Slug);
            if (existing != null) {
                if (existing.Deleted) continue;
                var before = Snapshot(existing);
                foreach (var locale in new[] { "ka", "en" }) {
                    var current = JsonNode.Parse(locale == "ka" ? existing.KaJson : existing.EnJson)!.AsObject();
                    var seed = JsonNode.Parse(locale == "ka" ? row.KaJson : row.EnJson)!.AsObject();
                    foreach (var p in seed) if (!current.ContainsKey(p.Key)) current[p.Key] = p.Value?.DeepClone();
                    if (current["texts"] is JsonObject texts && seed["texts"] is JsonObject seedTexts)
                        foreach (var p in seedTexts) if (!texts.ContainsKey(p.Key)) texts[p.Key] = p.Value?.DeepClone();
                    if (locale == "ka") existing.KaJson = current.ToJsonString(); else existing.EnJson = current.ToJsonString();
                }
                if (before != Snapshot(existing)) {
                    existing.Version = Guid.NewGuid(); existing.UpdatedBy = "Content schema migration"; existing.UpdatedAt = DateTimeOffset.UtcNow;
                    db.ContentRevisions.Add(new() { RecordId = existing.Id, Module = existing.Module, Actor = existing.UpdatedBy, ActorId = "migration", Action = "supplement", BeforeJson = before, AfterJson = Snapshot(existing) });
                }
                continue;
            }
            row.CreatedBy = row.UpdatedBy = "Initial content migration"; db.ContentRecords.Add(row);
            db.ContentRevisions.Add(new() { RecordId = row.Id, Module = row.Module, Actor = row.CreatedBy, ActorId = "migration", Action = "import", AfterJson = Snapshot(row) });
        }
        db.Bootstrap.Add(new() { Id = "content-cms-v4" }); await db.SaveChangesAsync();
    }
    private static Dictionary<string,string[]> Validate(ContentInput input, string module) {
        var errors = new Dictionary<string,string[]>();
        if (!Regex.IsMatch(input.Slug ?? "", "^[a-z0-9]+(?:-[a-z0-9]+)*$") || input.Slug!.Length > 150) errors["slug"] = ["Use a valid lowercase slug."];
        foreach (var (locale, data) in new[] { ("ka", input.Ka), ("en", input.En) }) {
            if (data == null || data.ToJsonString().Length > 200000) { errors[locale] = ["Invalid content or content too large."]; continue; }
            if (module is not ("page-text" or "structure") && string.IsNullOrWhiteSpace(data["title"]?.ToString())) errors[locale + ".title"] = ["Title is required in both languages."];
            void Check(JsonNode? node, string path, string key, int depth) {
                if (depth > 12) { errors[path] = ["Content is too deeply nested."]; return; }
                if (!path.Contains(".texts.")) {
                    if (key is "blocks" or "links" or "socials" or "files" or "schedule" or "participants" or "results" or "changes" or "media" or "gallery" or "images" or "activities" or "highlights" or "stats" or "specs" or "children" && node is not JsonArray) { errors[path] = ["Expected a list."]; return; }
                    if (key is "title" or "description" or "position" or "text" or "image" or "url" or "href" or "videoUrl" && node is not JsonValue) { errors[path] = ["Expected text."]; return; }
                }
                if (node is JsonObject obj) { foreach (var p in obj) Check(p.Value, path + "." + p.Key, p.Key, depth + 1); return; }
                if (node is JsonArray arr) { if (arr.Count > 500) errors[path] = ["Too many items."]; foreach (var n in arr) Check(n, path, "", depth + 1); return; }
                var s = node?.ToString() ?? "";
                if (s.Length > 20000) errors[path] = ["Text is too long."];
                if (Regex.IsMatch(s, "<\\s*(script|iframe|object|embed)\\b", RegexOptions.IgnoreCase)) errors[path] = ["Embedded executable HTML is not allowed."];
                if (path.Contains(".texts.")) return; // Translation labels are editorial text, not data fields.
                if (key is "openTime" or "closeTime" && s.Length > 0 && !Regex.IsMatch(s, "^(?:[01][0-9]|2[0-3]):(?:00|30)$")) errors[path] = ["Choose a time in 30-minute increments."];
                if (key is "startAt" or "endAt" or "publishedAt" or "date" && s.Length > 0 && (!DateTimeOffset.TryParse(s, out var date) || date.Minute % 30 != 0 || date.Second != 0)) errors[path] = ["Choose a valid date/time in 30-minute increments."];
                if ((key.EndsWith("Url", StringComparison.OrdinalIgnoreCase) || key is "url" or "href" or "image") && s.Length > 0 && !(s.StartsWith('/') && !s.StartsWith("//")) && !(Uri.TryCreate(s, UriKind.Absolute, out var url) && url.Scheme == "https")) errors[path] = ["Use a relative site path or an HTTPS URL."];
                if (key == "email" && s.Length > 0 && !new EmailAddressAttribute().IsValid(s)) errors[path] = ["Enter a valid email address."];
                if (key == "latitude" && (!double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var lat) || !double.IsFinite(lat) || lat is < -90 or > 90)) errors[path] = ["Latitude must be between -90 and 90."];
                if (key == "longitude" && (!double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var lng) || !double.IsFinite(lng) || lng is < -180 or > 180)) errors[path] = ["Longitude must be between -180 and 180."];
                if (key == "difficulty" && s.Length > 0 && s is not ("easy" or "medium" or "difficult")) errors[path] = ["Choose Easy, Medium or Difficult."];
                if (key == "liftType" && s.Length > 0 && s is not ("gondola" or "chairlift" or "drag-lift")) errors[path] = ["Choose a valid lift type."];
                if (key == "duration" && s.Length > 0 && s is not ("2" or "5" or "10" or "15" or "20" or "30")) errors[path] = ["Choose a valid duration."];
                if (key == "month" && (!int.TryParse(s, out var month) || month is < 1 or > 12)) errors[path] = ["Choose a valid month."];
                if (key == "year" && (!int.TryParse(s, out var year) || year is < 1980 or > 2060)) errors[path] = ["Choose a valid year."];
                if (key == "sourceType" && s is not ("embed" or "video" or "image")) errors[path] = ["Choose Embed, Video or Image."];
                if (key == "mimeType" && s != "application/pdf") errors[path] = ["Documents must be PDFs."];
            }
            Check(data, locale, "", 0);
            if (Modules.Contains(module) && module is not ("page-text" or "structure") && data["description"] is not JsonValue)
                errors[locale + ".description"] = ["Description must be text (it may be empty)."];
            foreach (var key in new[] { "blocks", "schedule", "participants", "changes", "results", "media" })
                if (data[key] is JsonArray blocks && blocks.Any(x => x is not JsonObject b || b["title"] is not JsonValue || b["text"] is not JsonValue)) errors[locale + "." + key] = ["Each block needs title and text fields."];
            if (input.Published) {
                foreach (var key in new[] { "links", "socials" })
                    if (data[key] is JsonArray links && links.Any(x => x is not JsonObject link || string.IsNullOrWhiteSpace(link["label"]?.ToString()) || string.IsNullOrWhiteSpace(link["url"]?.ToString()))) errors[locale + "." + key] = ["Each link needs a label and URL before publishing."];
                if (data["files"] is JsonArray files && files.Any(x => x is not JsonObject f || string.IsNullOrWhiteSpace(f["name"]?.ToString()) || !((f["url"]?.ToString() ?? "").Split('?')[0].EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)))) errors[locale + ".files"] = ["Each document needs a name and PDF URL before publishing."];
            }
            if (module == "projects") {
                foreach (var key in new[] { "resort", "resortId", "category", "image", "date", "description", "overview" })
                    if (data[key] is not JsonValue value || !value.TryGetValue<string>(out _)) errors[locale + "." + key] = ["Expected text."];
                if (!Regex.IsMatch(data["date"]?.ToString() ?? "", "^\\d{4}-\\d{2}-\\d{2}$") || !DateOnly.TryParse(data["date"]?.ToString(), out _)) errors[locale + ".date"] = ["Choose a project date."];
                foreach (var key in new[] { "activities", "highlights" })
                    if (data[key] is not JsonArray list || list.Any(x => x is not JsonValue v || !v.TryGetValue<string>(out _))) errors[locale + "." + key] = ["Expected a list of text values."];
            }
            if (DateTimeOffset.TryParse(data["startAt"]?.ToString(), out var start) && DateTimeOffset.TryParse(data["endAt"]?.ToString(), out var end) && end < start) errors[locale + ".endAt"] = ["End must follow start."];
            if (data["areaId"] is {} area && area.ToString() is not ("all" or "bakuriani" or "gudauri-kobi" or "mestia" or "goderdzi")) errors[locale + ".areaId"] = ["Choose a valid resort or General."];
        }
        return errors;
    }
    public static void MapContentCms(this WebApplication app, RouteGroupBuilder admin) {
        app.MapGet("/api/content/{module}", async (string module, string? locale, AppDb db, HttpContext ctx) => {
            if (!Modules.Contains(module) || locale is not (null or "ka" or "en")) return Results.BadRequest();
            ctx.Response.Headers.CacheControl = "no-store";
            var rows = await db.ContentRecords.AsNoTracking().Where(x => x.Module == module && x.Published && !x.Deleted).OrderBy(x => x.SortOrder).ThenBy(x => x.CreatedAt).ToListAsync();
            return Results.Ok(rows.Select(x => x.Localized(locale ?? "ka")));
        });
        admin.MapGet("/content/{module}", async (string module, AppDb db) => !Modules.Contains(module) ? Results.NotFound() : Results.Ok(await db.ContentRecords.AsNoTracking().Where(x => x.Module == module && !x.Deleted).OrderBy(x => x.SortOrder).ToListAsync()));
        admin.MapGet("/content/{module}/{id:guid}/history", async (string module, Guid id, AppDb db) => Results.Ok(await db.ContentRevisions.AsNoTracking().Where(x => x.Module == module && x.RecordId == id).OrderByDescending(x => x.At).Take(100).ToListAsync()));
        admin.MapPut("/content/{module}/reorder", async (string module, OrderItem[] input, AppDb db, HttpContext ctx) => {
            if (!Modules.Contains(module)) return Results.NotFound();
            var rows = await db.ContentRecords.Where(x => x.Module == module && !x.Deleted).ToListAsync();
            if (input.Length != rows.Count || input.Select(x => x.Id).Distinct().Count() != rows.Count) return Results.BadRequest();
            for (var i = 0; i < input.Length; i++) {
                var row = rows.SingleOrDefault(x => x.Id == input[i].Id); if (row == null || row.Version != input[i].Version) return Conflict();
                var before = Snapshot(row); row.SortOrder = i; row.Version = Guid.NewGuid(); row.UpdatedBy = ctx.User.Identity?.Name ?? "unknown"; row.UpdatedAt = DateTimeOffset.UtcNow; Audit(db,ctx,row,"reorder",before);
            }
            return await Save(db) ? Results.Ok(rows.OrderBy(x => x.SortOrder)) : Conflict();
        });
        admin.MapPost("/content/{module}", async (string module, ContentInput input, AppDb db, HttpContext ctx) => {
            if (!Modules.Contains(module)) return Results.NotFound();
            var errors = Validate(input, module); if (errors.Count > 0) return Results.ValidationProblem(errors);
            var r = new ContentRecord { Module = module, Slug = input.Slug, KaJson = input.Ka.ToJsonString(), EnJson = input.En.ToJsonString(), Published = input.Published, SortOrder = input.SortOrder, CreatedBy = ctx.User.Identity?.Name ?? "unknown", UpdatedBy = ctx.User.Identity?.Name ?? "unknown" };
            db.ContentRecords.Add(r); Audit(db, ctx, r, "create", "null");
            return await Save(db) ? Results.Created($"/api/admin/content/{module}/{r.Id}", r) : Conflict();
        });
        admin.MapPut("/content/{module}/{id:guid}", async (string module, Guid id, ContentInput input, AppDb db, HttpContext ctx) => {
            var r = await db.ContentRecords.SingleOrDefaultAsync(x => x.Id == id && x.Module == module && !x.Deleted); if (r == null) return Results.NotFound();
            if (r.Version != input.Version) return Conflict();
            var errors = Validate(input, module); if (errors.Count > 0) return Results.ValidationProblem(errors);
            if (input.Slug != r.Slug) return Results.BadRequest(new { message = "Existing URLs are preserved. Slug cannot change." });
            var before = Snapshot(r); r.KaJson = input.Ka.ToJsonString(); r.EnJson = input.En.ToJsonString(); r.Published = input.Published; r.SortOrder = input.SortOrder;
            r.UpdatedAt = DateTimeOffset.UtcNow; r.UpdatedBy = ctx.User.Identity?.Name ?? "unknown"; r.Version = Guid.NewGuid(); Audit(db, ctx, r, "update", before);
            return await Save(db) ? Results.Ok(r) : Conflict();
        });
        admin.MapDelete("/content/{module}/{id:guid}", async (string module, Guid id, Guid version, AppDb db, HttpContext ctx) => {
            var r = await db.ContentRecords.SingleOrDefaultAsync(x => x.Id == id && x.Module == module && !x.Deleted); if (r == null) return Results.NotFound();
            if (r.Version != version) return Conflict(); var before = Snapshot(r);
            r.Deleted = true; r.UpdatedAt = DateTimeOffset.UtcNow; r.UpdatedBy = ctx.User.Identity?.Name ?? "unknown"; r.Version = Guid.NewGuid(); Audit(db, ctx, r, "delete", before);
            return await Save(db) ? Results.NoContent() : Conflict();
        }).RequireAuthorization("SuperAdmin");
        app.MapPost("/api/contact", async (MessageInput input, AppDb db) => {
            if (!string.IsNullOrEmpty(input.Website) || string.IsNullOrWhiteSpace(input.FirstName) || input.FirstName.Length > 150 || (input.LastName?.Length ?? 0) > 150 || string.IsNullOrWhiteSpace(input.Email) || !new EmailAddressAttribute().IsValid(input.Email) || input.Email.Length > 254 || (input.Phone?.Length ?? 0) > 50 || string.IsNullOrWhiteSpace(input.Subject) || input.Subject.Length > 100 || string.IsNullOrWhiteSpace(input.Message) || input.Message.Length is < 10 or > 5000) return Results.BadRequest(new { message = "Please check required fields and email." });
            var message = new ContactMessage { Name = (input.FirstName.Trim() + " " + input.LastName?.Trim()).Trim(), Email = input.Email.Trim(), Phone = input.Phone?.Trim() ?? "", Subject = input.Subject, Message = input.Message.Trim() };
            db.ContactMessages.Add(message); await db.SaveChangesAsync(); return Results.Created("/api/contact", new { received = true });
        }).RequireRateLimiting("contact");
        admin.MapGet("/messages", async (AppDb db) => await db.ContactMessages.AsNoTracking().OrderByDescending(x => x.SubmittedAt).Take(500).ToListAsync());
        admin.MapPut("/messages/{id:guid}", async (Guid id, ReadMessage input, AppDb db, HttpContext ctx) => {
            var m = await db.ContactMessages.FindAsync(id); if (m == null) return Results.NotFound(); m.Read = input.Read;
            db.ContentRevisions.Add(new() { RecordId = id, Module = "messages", Actor = ctx.User.Identity?.Name ?? "unknown", ActorId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown", Action = input.Read ? "read" : "unread" });
            await db.SaveChangesAsync(); return Results.Ok(m);
        });
        admin.MapDelete("/messages/{id:guid}", async (Guid id, AppDb db, HttpContext ctx) => {
            var m = await db.ContactMessages.FindAsync(id); if (m == null) return Results.NotFound(); db.ContactMessages.Remove(m);
            db.ContentRevisions.Add(new() { RecordId = id, Module = "messages", Actor = ctx.User.Identity?.Name ?? "unknown", ActorId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown", Action = "delete" });
            await db.SaveChangesAsync(); return Results.NoContent();
        }).RequireAuthorization("SuperAdmin");
    }
    private static IResult Conflict() => Results.Conflict(new { message = "This content changed in another session, or the slug already exists. Reload before saving." });
    private static async Task<bool> Save(AppDb db) {
        try { await db.SaveChangesAsync(); return true; }
        catch (DbUpdateConcurrencyException) { return false; }
        catch (DbUpdateException e) when (e.InnerException is Npgsql.PostgresException { SqlState: "23505" }) { return false; }
    }
}
