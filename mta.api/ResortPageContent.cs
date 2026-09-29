using System.Text.Json;
using System.Text.RegularExpressions;
namespace Mta.Api;

public static class ResortPageContent
{
    static bool Text(JsonElement obj, string key, int max = 20000) =>
        !obj.TryGetProperty(key, out var v) || (v.ValueKind == JsonValueKind.String && v.GetString()!.Length <= max);
    static bool Url(JsonElement obj, string key, string? extension = null)
    {
        if (!obj.TryGetProperty(key, out var v)) return true;
        if (v.ValueKind != JsonValueKind.String || v.GetString()!.Length > 2000) return false;
        var value = v.GetString()!;
        if (value == "") return true;
        var local = Regex.IsMatch(value, @"^/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_.-]+$");
        if (!local && (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != "https" || !string.IsNullOrEmpty(uri.UserInfo))) return false;
        return extension == null || Regex.IsMatch(value.Split('?')[0], extension, RegexOptions.IgnoreCase);
    }
    static bool Rows(JsonElement obj, string key, string[] fields, Func<JsonElement, bool>? extra = null)
    {
        if (!obj.TryGetProperty(key, out var rows)) return true;
        return rows.ValueKind == JsonValueKind.Array && rows.GetArrayLength() <= 100 &&
            rows.EnumerateArray().All(row => row.ValueKind == JsonValueKind.Object &&
                fields.All(f => row.TryGetProperty(f, out _) && Text(row, f, 2000)) && (extra == null || extra(row)));
    }
    public static bool Valid(JsonElement page)
    {
        if (page.ValueKind != JsonValueKind.Object) return false;
        if (!new[] { "about", "history", "facts", "arrivalText", "infrastructureText" }.All(k => Text(page, k))) return false;
        if (!Url(page, "logoUrl", @"\.(png|webp|jpg|jpeg)$") || !Url(page, "videoUrl", @"\.(mp4|webm)$") ||
            !Url(page, "videoWebmUrl", @"\.webm$") || !Url(page, "posterUrl", @"\.(png|webp|jpg|jpeg)$") ||
            !Url(page, "pdfUrl", @"\.pdf$") || !Url(page, "purchaseUrl") || !Url(page, "bannerImage", @"\.(png|webp|jpg|jpeg)$")) return false;
        foreach (var key in new[] { "markerX", "markerY" })
            if (page.TryGetProperty(key, out var n) && (n.ValueKind != JsonValueKind.String ||
                !double.TryParse(n.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var number) || !double.IsFinite(number) || number < 0 || number > 100)) return false;
        if (page.TryGetProperty("social", out var social) && (social.ValueKind != JsonValueKind.Object ||
            !new[] { "resortFacebook", "facebook", "instagram", "tiktok" }.All(k => Url(social, k)))) return false;
        string[] liftTypes = ["Gondola","Chairlift","Drag lift","Surface lift","Magic carpet","გონდოლა","სავარძლიანი საბაგირო","ბუგელი","ზედაპირული საბაგირო","კონვეიერი"];
        return Rows(page, "travelTimes", ["city", "time"]) &&
            Rows(page, "trailList", ["name", "length", "difficulty"], row => row.GetProperty("difficulty").GetString() is "easy" or "medium" or "difficult") &&
            Rows(page, "liftList", ["name", "type", "duration", "hours"], row => liftTypes.Contains(row.GetProperty("type").GetString())) &&
            Rows(page, "activities", ["title", "text", "iconKey"]);
    }
}
