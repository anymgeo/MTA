using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Mta.Api;

public class News
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = "";
    public DateOnly Date { get; set; }
    public string Image { get; set; } = "";
    public string Category { get; set; } = "news";
    public string[] Gallery { get; set; } = [];
    public string TitleKa { get; set; } = "";
    public string ExcerptKa { get; set; } = "";
    public string[] ContentKa { get; set; } = [];
    public string TitleEn { get; set; } = "";
    public string ExcerptEn { get; set; } = "";
    public string[] ContentEn { get; set; } = [];
    public bool Published { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid Version { get; set; } = Guid.NewGuid();

    public object Localized(string locale) => new {
        Id, Slug, Date, Image, Category, Gallery,
        title = locale == "en" ? TitleEn : TitleKa,
        excerpt = locale == "en" ? ExcerptEn : ExcerptKa,
        content = locale == "en" ? ContentEn : ContentKa
    };
}

public class AuditEntry
{
    public long Id { get; set; }
    public string Actor { get; set; } = "";
    public string Action { get; set; } = "";
    public Guid NewsId { get; set; }
    public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;
}

public class BootstrapState
{
    public string Id { get; set; } = "";
} 

public class PortalUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
}

public class AppDb(DbContextOptions<AppDb> options) : IdentityDbContext<PortalUser>(options)
{
    public DbSet<News> News => Set<News>();
    public DbSet<Faq> Faqs => Set<Faq>();
    public DbSet<Resort> Resorts => Set<Resort>();
    public DbSet<AuditEntry> Audit => Set<AuditEntry>();
    public DbSet<BootstrapState> Bootstrap => Set<BootstrapState>();
    protected override void OnModelCreating(ModelBuilder model)
    {
        base.OnModelCreating(model);
        model.Entity<Faq>().Property(f => f.Version).IsConcurrencyToken();
        model.Entity<Faq>().HasIndex(f => new { f.Scope, f.Published, f.SortOrder });
        model.Entity<News>().HasIndex(n => n.Slug).IsUnique();
        model.Entity<News>().Property(n => n.Slug).HasMaxLength(150);
        model.Entity<News>().Property(n => n.Category).HasMaxLength(20);
        model.Entity<News>().ToTable(t => t.HasCheckConstraint("CK_News_Category", "\"Category\" IN ('news', 'article', 'blog')"));
        model.Entity<News>().Property(n => n.Version).IsConcurrencyToken();
        model.Entity<News>().HasIndex(n => new { n.Published, n.Date });
        model.Entity<Resort>().HasIndex(r => r.Slug).IsUnique();
        model.Entity<Resort>().Property(r => r.Slug).HasMaxLength(150);
        model.Entity<Resort>().Property(r => r.Version).IsConcurrencyToken();
        model.Entity<Resort>().Property(r => r.KaJson).HasColumnType("jsonb");
        model.Entity<Resort>().Property(r => r.EnJson).HasColumnType("jsonb");
    }
}
