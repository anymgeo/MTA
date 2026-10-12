using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;

namespace Mta.Api;

// Explicit, once-only editorial migration. Existing IDs, revisions and custom news survive.
public static class BrandContentRefresh
{
    private const string Key = "brand-navigation-official-news-20261005";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    public static async Task ApplyAsync(AppDb db, string root)
    {
        if (await db.Bootstrap.AnyAsync(x => x.Id == Key)) return;
        await using var transaction = await db.Database.BeginTransactionAsync();
        var navigation = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "brand-navigation.json")))!.AsArray();
        foreach (var entry in navigation)
        {
            var slug = entry!["slug"]!.ToString();
            var record = await db.ContentRecords.SingleOrDefaultAsync(x => x.Module == "navigation" && x.Slug == slug);
            if (record?.Deleted == true) continue;
            var before = JsonSerializer.Serialize(record, Json);
            if (record == null) { record = new() { Module = "navigation", Slug = slug, CreatedBy = "MTA brand content update" }; db.ContentRecords.Add(record); }
            // Retain additional CMS fields; replace only the navigation fields requested.
            foreach (var locale in new[] { "ka", "en" })
            {
                var data = JsonNode.Parse(locale == "ka" ? record.KaJson : record.EnJson)!.AsObject();
                foreach (var field in entry[locale]!.AsObject()) data[field.Key] = field.Value?.DeepClone();
                if (locale == "ka") record.KaJson = data.ToJsonString(); else record.EnJson = data.ToJsonString();
            }
            record.SortOrder = entry["sortOrder"]!.GetValue<int>(); record.Published = true;
            record.UpdatedBy = "MTA brand content update"; record.UpdatedAt = DateTimeOffset.UtcNow; record.Version = Guid.NewGuid();
            db.ContentRevisions.Add(new() { RecordId = record.Id, Module = record.Module, Actor = record.UpdatedBy, ActorId = "migration", Action = "brand-navigation", BeforeJson = before, AfterJson = JsonSerializer.Serialize(record, Json) });
        }
        // Homepage/footer links must not point at the removed homepage map anchor.
        var linked = await db.ContentRecords.Where(x => (x.Module == "home-navigation" || x.Module == "footer") && !x.Deleted).ToListAsync();
        foreach (var record in linked)
        {
            var before = JsonSerializer.Serialize(record, Json);
            record.KaJson = record.KaJson.Replace("/#map\"", "/maps\"");
            record.EnJson = record.EnJson.Replace("/#map\"", "/maps\"");
            if (before == JsonSerializer.Serialize(record, Json)) continue;
            record.Version = Guid.NewGuid(); record.UpdatedBy = "MTA brand content update"; record.UpdatedAt = DateTimeOffset.UtcNow;
            db.ContentRevisions.Add(new() { RecordId = record.Id, Module = record.Module, Actor = record.UpdatedBy, ActorId = "migration", Action = "map-link", BeforeJson = before, AfterJson = JsonSerializer.Serialize(record, Json) });
        }
        var news = JsonSerializer.Deserialize<List<News>>(await File.ReadAllTextAsync(Path.Combine(root, "official-news-2026.json")), Json)!;
        foreach (var article in news)
        {
            var input = new NewsInput(article.Slug, article.Date, article.Image, article.Category, article.Gallery, article.TitleKa, article.ExcerptKa, article.ContentKa, article.TitleEn, article.ExcerptEn, article.ContentEn, article.Published, null);
            if (input.Validate().Count > 0) throw new InvalidDataException($"Invalid official news seed: {article.Slug}");
            if (await db.News.AnyAsync(x => x.Slug == article.Slug)) continue;
            db.News.Add(article);
            db.Audit.Add(new() { NewsId = article.Id, Actor = "Official mta.ski content import", Action = "import" });
        }
        var demos = JsonSerializer.Deserialize<List<News>>(await File.ReadAllTextAsync(Path.Combine(root, "seed-news.json")), Json)!;
        foreach (var demo in demos)
        {
            var existing = await db.News.SingleOrDefaultAsync(x => x.Slug == demo.Slug);
            // Hide only unchanged placeholder copy; never remove or overwrite an editor's article.
            if (existing == null || existing.Date != demo.Date || existing.Image != demo.Image || existing.Category != demo.Category || !existing.Gallery.SequenceEqual(demo.Gallery) || existing.TitleKa != demo.TitleKa || existing.TitleEn != demo.TitleEn || existing.ExcerptKa != demo.ExcerptKa || existing.ExcerptEn != demo.ExcerptEn || !existing.ContentKa.SequenceEqual(demo.ContentKa) || !existing.ContentEn.SequenceEqual(demo.ContentEn)) continue;
            existing.Published = false; existing.Version = Guid.NewGuid(); existing.UpdatedAt = DateTimeOffset.UtcNow;
            db.Audit.Add(new() { NewsId = existing.Id, Actor = "Official mta.ski content import", Action = "hide-demo" });
        }
        db.Bootstrap.Add(new() { Id = Key });
        await db.SaveChangesAsync(); await transaction.CommitAsync();
    }
}
