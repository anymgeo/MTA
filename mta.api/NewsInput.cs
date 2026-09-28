using System.Text.RegularExpressions;

namespace Mta.Api;

public record NewsInput(
    string? Slug, DateOnly Date, string? Image, string? Category, string[]? Gallery,
    string? TitleKa, string? ExcerptKa, string[]? ContentKa,
    string? TitleEn, string? ExcerptEn, string[]? ContentEn,
    bool Published, Guid? Version)
{
    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>();
        void Check(bool valid, string field, string message) { if (!valid) errors[field] = [message]; }
        bool Text(string? s, int max, bool required = true) => s != null && s.Length <= max && (!required || !string.IsNullOrWhiteSpace(s));
        Check(Slug != null && Regex.IsMatch(Slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$") && Slug.Length <= 150, "slug", "მისამართისთვის გამოიყენეთ ლათინური ასოები, ციფრები და ტირე.");
        Check(Date.Year >= 2000 && Date.Year <= 2100, "date", "მიუთითეთ სწორი თარიღი.");
        Check(Category is "news" or "article" or "blog", "category", "აირჩიეთ სწორი კატეგორია.");
        Check(Text(TitleKa, 200), "titleKa", "ქართული სათაური აუცილებელია (მაქს. 200 სიმბოლო).");
        Check(Text(ExcerptKa, 600, Published), "excerptKa", "ქართული მოკლე აღწერა აუცილებელია გამოქვეყნებისთვის (მაქს. 600).");
        Check(Text(TitleEn, 200, Published), "titleEn", "ინგლისური სათაური აუცილებელია გამოქვეყნებისთვის (მაქს. 200).");
        Check(Text(ExcerptEn, 600, Published), "excerptEn", "ინგლისური აღწერა აუცილებელია გამოქვეყნებისთვის (მაქს. 600).");
        bool Paragraphs(string[]? items) => items != null && items.Length <= 100 && items.All(x => Text(x, 10000)) && (!Published || items.Length > 0);
        Check(Paragraphs(ContentKa), "contentKa", "შეავსეთ ქართული ტექსტი; მაქსიმუმ 100 აბზაცი.");
        Check(Paragraphs(ContentEn), "contentEn", "შეავსეთ ინგლისური ტექსტი; მაქსიმუმ 100 აბზაცი.");
        Check(Image != null && ((!Published && Image == "") || ValidImage(Image)), "image", "აირჩიეთ მთავარი ფოტო.");
        Check(Gallery != null && Gallery.Length <= 12 && Gallery.All(ValidImage), "gallery", "გალერეაში დასაშვებია მაქსიმუმ 12 ფოტო.");
        return errors;
    }

    // Only local image paths: no arbitrary URL fetching or executable SVG uploads.
    public static bool ValidImage(string path) => path.Length <= 250 && Regex.IsMatch(path, @"^/(?:media|news)/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$", RegexOptions.IgnoreCase);
    public void Apply(News n)
    {
        n.Slug = Slug!; n.Date = Date; n.Image = Image!; n.Category = Category!; n.Gallery = Gallery!;
        n.TitleKa = TitleKa!.Trim(); n.ExcerptKa = ExcerptKa!.Trim(); n.ContentKa = ContentKa!;
        n.TitleEn = TitleEn!.Trim(); n.ExcerptEn = ExcerptEn!.Trim(); n.ContentEn = ContentEn!;
        n.Published = Published; n.UpdatedAt = DateTimeOffset.UtcNow; n.Version = Guid.NewGuid();
    }
}
