using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace Mta.Api;

public class Faq
{
    public Guid Id { get; set; } = Guid.NewGuid();
    // Empty scope means the main FAQ page; otherwise a resort slug.
    public string Scope { get; set; } = "";
    public string CategoryKa { get; set; } = "";
    public string CategoryEn { get; set; } = "";
    public string QuestionKa { get; set; } = "";
    public string AnswerKa { get; set; } = "";
    public string QuestionEn { get; set; } = "";
    public string AnswerEn { get; set; } = "";
    public int SortOrder { get; set; }
    public bool Published { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public record FaqInput(string? Scope, string? CategoryKa, string? CategoryEn,
    string? QuestionKa, string? AnswerKa, string? QuestionEn, string? AnswerEn,
    int SortOrder, bool Published, Guid? Version)
{
    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>();
        foreach (var (key, value, max) in new[] {
            ("QuestionKa", QuestionKa, 500), ("QuestionEn", QuestionEn, 500),
            ("AnswerKa", AnswerKa, 10000), ("AnswerEn", AnswerEn, 10000) })
            if (string.IsNullOrWhiteSpace(value) || value.Length > max)
                errors[key] = [$"{key}: required, maximum {max} characters."];
        if ((CategoryKa?.Length ?? 0) > 100 || (CategoryEn?.Length ?? 0) > 100 ||
            string.IsNullOrWhiteSpace(CategoryKa) != string.IsNullOrWhiteSpace(CategoryEn))
            errors["Category"] = ["Provide both category translations (maximum 100 characters), or leave both blank."];
        if (SortOrder < 0 || SortOrder > 1000000) errors["SortOrder"] = ["Order must be between 0 and 1000000."];
        if ((Scope?.Length ?? 0) > 150) errors["Scope"] = ["Invalid resort."];
        return errors;
    }
    public void Apply(Faq row)
    {
        row.Scope = Scope?.Trim() ?? "";
        row.CategoryKa = CategoryKa?.Trim() ?? ""; row.CategoryEn = CategoryEn?.Trim() ?? "";
        row.QuestionKa = QuestionKa!.Trim(); row.QuestionEn = QuestionEn!.Trim();
        row.AnswerKa = AnswerKa!.Trim(); row.AnswerEn = AnswerEn!.Trim();
        row.SortOrder = SortOrder; row.Published = Published;
        row.Version = Guid.NewGuid(); row.UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public static class FaqEndpoints
{
    public static void MapFaqs(this WebApplication app, RouteGroupBuilder admin)
    {
        app.MapGet("/api/faqs", async (string? locale, string? scope, AppDb db, HttpContext ctx) => {
            if (locale is not (null or "ka" or "en")) return Results.BadRequest();
            ctx.Response.Headers.CacheControl = "no-store";
            var rows = await db.Faqs.AsNoTracking().Where(f => f.Published && f.Scope == (scope ?? ""))
                .OrderBy(f => f.SortOrder).ThenBy(f => f.Id).ToListAsync();
            return Results.Ok(rows.Select(f => new { f.Id, f.SortOrder,
                category = locale == "en" ? f.CategoryEn : f.CategoryKa,
                question = locale == "en" ? f.QuestionEn : f.QuestionKa,
                answer = locale == "en" ? f.AnswerEn : f.AnswerKa }));
        });
        admin.MapGet("/faqs", async (AppDb db) => await db.Faqs.AsNoTracking()
            .OrderBy(f => f.Scope).ThenBy(f => f.SortOrder).ThenBy(f => f.Id).ToListAsync());
        admin.MapPost("/faqs", async (FaqInput input, AppDb db, HttpContext ctx) => {
            var errors = await Validate(input, db); if (errors.Count > 0) return Results.ValidationProblem(errors);
            var row = new Faq(); input.Apply(row); db.Faqs.Add(row); Audit(db, ctx, "faq-create", row.Id);
            await db.SaveChangesAsync(); return Results.Created($"/api/admin/faqs/{row.Id}", row);
        });
        admin.MapPut("/faqs/{id:guid}", async (Guid id, FaqInput input, AppDb db, HttpContext ctx) => {
            var errors = await Validate(input, db); if (errors.Count > 0) return Results.ValidationProblem(errors);
            var row = await db.Faqs.FindAsync(id); if (row == null) return Results.NotFound();
            if (row.Version != input.Version) return Conflict();
            input.Apply(row); Audit(db, ctx, "faq-update", id);
            try { await db.SaveChangesAsync(); return Results.Ok(row); }
            catch (DbUpdateConcurrencyException) { return Conflict(); }
        });
        admin.MapDelete("/faqs/{id:guid}", async (Guid id, Guid version, AppDb db, HttpContext ctx) => {
            var row = await db.Faqs.FindAsync(id); if (row == null) return Results.NotFound();
            if (row.Version != version) return Conflict();
            db.Faqs.Remove(row); Audit(db, ctx, "faq-delete", id);
            try { await db.SaveChangesAsync(); return Results.NoContent(); }
            catch (DbUpdateConcurrencyException) { return Conflict(); }
        });
    }
    private static async Task<Dictionary<string, string[]>> Validate(FaqInput input, AppDb db)
    {
        var errors = input.Validate();
        if (!string.IsNullOrWhiteSpace(input.Scope) && !await db.Resorts.AnyAsync(r => r.Slug == input.Scope.Trim()))
            errors["Scope"] = ["Select an existing resort, or the main FAQ page."];
        return errors;
    }
    private static IResult Conflict() => Results.Conflict(new { message = "FAQ changed in another session. Refresh the list before editing again." });
    private static void Audit(AppDb db, HttpContext ctx, string action, Guid id) => db.Audit.Add(new AuditEntry {
        Actor = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown", Action = action, NewsId = id });
}
