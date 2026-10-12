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
    static string OptionalString(JsonElement obj, string key) =>
        obj.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString()!.Trim() : "";
    static bool TrailDestination(JsonElement row)
    {
        var lat = OptionalString(row, "destinationLat");
        var lng = OptionalString(row, "destinationLng");
        if ((lat.Length == 0) != (lng.Length == 0)) return false;
        if (lat.Length > 0)
        {
            if (!double.TryParse(lat, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var latitude) ||
                !double.TryParse(lng, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var longitude) ||
                !double.IsFinite(latitude) || !double.IsFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false;
        }
        var destinationUrl = OptionalString(row, "destinationUrl");
        if (destinationUrl.Length == 0) return true;
        if (!Url(row, "destinationUrl") || !Uri.TryCreate(destinationUrl, UriKind.Absolute, out var uri)) return false;
        var host = uri.Host.ToLowerInvariant();
        var shortLink = host is "maps.app.goo.gl" or "goo.gl";
        var googleMaps = (host == "google.com" || host.EndsWith(".google.com") || host.StartsWith("www.google.") || host.StartsWith("maps.google.")) &&
            uri.AbsolutePath.StartsWith("/maps", StringComparison.OrdinalIgnoreCase);
        return shortLink || googleMaps;
    }
    public static bool Valid(JsonElement page)
    {
        if (page.ValueKind != JsonValueKind.Object) return false;
        if (!new[] { "about", "history", "facts", "arrivalText", "infrastructureText", "infrastructureImportNotes" }.All(k => Text(page, k))) return false;
        if (!Url(page, "logoUrl", @"\.(png|webp|jpg|jpeg)$") || !Url(page, "videoUrl", @"\.(mp4|webm)$") ||
            !Url(page, "videoWebmUrl", @"\.webm$") || !Url(page, "posterUrl", @"\.(png|webp|jpg|jpeg)$") ||
            !Url(page, "pdfUrl", @"\.pdf$") || !Url(page, "purchaseUrl") || !Url(page, "informationUrl") || !Url(page, "bannerImage", @"\.(png|webp|jpg|jpeg)$")) return false;
        foreach (var key in new[] { "markerX", "markerY" })
            if (page.TryGetProperty(key, out var n) && (n.ValueKind != JsonValueKind.String ||
                !double.TryParse(n.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var number) || !double.IsFinite(number) || number < 0 || number > 100)) return false;
        if (page.TryGetProperty("social", out var social) && (social.ValueKind != JsonValueKind.Object ||
            !new[] { "resortFacebook", "facebook", "instagram", "tiktok" }.All(k => Url(social, k)))) return false;
        string[] liftTypes = ["Gondola","Chairlift","Drag lift","Surface lift","Magic carpet","Funicular","გონდოლა","სავარძლიანი საბაგირო","ბუგელი","ზედაპირული საბაგირო","კონვეიერი","ფუნიკულიორი"];
        bool Metadata(JsonElement row) => new[] { "area", "length", "capacity", "stationElevations", "durationMin", "durationMax", "weekendHours", "sourceType", "source", "sourceRaw", "notes", "accessLifts", "snowmaking", "difficultySource", "destinationLabel", "destinationLat", "destinationLng", "destinationUrl" }.All(k => Text(row, k, 4000));
        return Rows(page, "travelTimes", ["city", "time"]) &&
            Rows(page, "trailList", ["name", "length", "difficulty"], row => Metadata(row) && TrailDestination(row) && row.GetProperty("difficulty").GetString() is "easy" or "medium" or "difficult" or "expert" or "mixed" or "unknown") &&
            Rows(page, "liftList", ["name", "type", "duration", "hours"], row => Metadata(row) && liftTypes.Contains(row.GetProperty("type").GetString())) &&
            Rows(page, "activities", ["title", "text", "iconKey"]);
    }
}
