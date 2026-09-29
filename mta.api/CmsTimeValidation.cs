using System.Text.Json;
using System.Text.RegularExpressions;
namespace Mta.Api;
public static class CmsTimeValidation
{
    static readonly string[] EnMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    static readonly string[] KaMonths = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
    public static bool Hours(string value) {
        if (value is "" or "—") return true;
        var parts = Regex.Split(value, @"\s*[–—-]\s*");
        return parts.Length == 2 && parts.All(MapEditorEndpoints.Times.Contains);
    }
    static bool Season(string value) {
        if (value is "" or "—") return true;
        var parts = Regex.Split(value, @"\s*[–—-]\s*");
        return parts.Length == 2 && (parts.All(EnMonths.Contains) || parts.All(KaMonths.Contains));
    }
    static bool Duration(string value, bool travel) => value is "" or "—" || (travel ? Enumerable.Range(1,48).Select(i=>i*15) : MapEditorEndpoints.Durations).Any(n=>value==$"{n} min");
    // Existing nonstandard text is preserved on unrelated edits. A changed value must be canonical.
    public static bool Valid(JsonElement current, JsonElement previous = default, string key = "")
    {
        if (current.ValueKind == JsonValueKind.Object) return current.EnumerateObject().All(p => Valid(p.Value,
            previous.ValueKind == JsonValueKind.Object && previous.TryGetProperty(p.Name, out var old) ? old : default, p.Name));
        if (current.ValueKind == JsonValueKind.Array) return current.EnumerateArray().Select((v,i)=>Valid(v,
            previous.ValueKind == JsonValueKind.Array && i<previous.GetArrayLength()?previous[i]:default,key)).All(v=>v);
        if (key is not ("hours" or "duration" or "time" or "winterSeason")) return true;
        if (current.ValueKind != JsonValueKind.String) return false;
        var text = current.GetString()!;
        if (previous.ValueKind == JsonValueKind.String && text == previous.GetString()) return true;
        return key switch { "hours" => Hours(text), "winterSeason" => Season(text), "duration" => Duration(text,false), "time" => Duration(text,true), _ => true };
    }
}
