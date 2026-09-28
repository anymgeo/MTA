using System.Net;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Npgsql;
using Mta.Api;

var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("Database") ?? throw new InvalidOperationException("ConnectionStrings__Database is required.");
builder.Services.AddDbContext<AppDb>(o => o.UseNpgsql(connection));
builder.Services.AddSingleton<ILiveConditionsProvider, UnavailableLiveConditionsProvider>();
builder.Services.AddIdentity<PortalUser, IdentityRole>(o => {
    o.Password.RequiredLength = 12; o.Password.RequireNonAlphanumeric = true;
    o.Lockout.MaxFailedAccessAttempts = 5; o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    o.User.RequireUniqueEmail = true;
}).AddEntityFrameworkStores<AppDb>().AddDefaultTokenProviders();
builder.Services.ConfigureApplicationCookie(o => {
    o.Cookie.Name = "mta.admin"; o.Cookie.HttpOnly = true; o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    o.ExpireTimeSpan = TimeSpan.FromHours(8); o.SlidingExpiration = false;
    o.Events.OnRedirectToLogin = c => { c.Response.StatusCode = 401; return Task.CompletedTask; };
    o.Events.OnRedirectToAccessDenied = c => { c.Response.StatusCode = 403; return Task.CompletedTask; };
    o.Events.OnValidatePrincipal = async c => {
        var signIn = c.HttpContext.RequestServices.GetRequiredService<SignInManager<PortalUser>>();
        var user = await signIn.ValidateSecurityStampAsync(c.Principal);
        if (user == null) {
            c.RejectPrincipal(); await signIn.SignOutAsync(); return;
        }
        c.ReplacePrincipal(await signIn.CreateUserPrincipalAsync(user));
    };
});
builder.Services.Configure<SecurityStampValidatorOptions>(o => o.ValidationInterval = TimeSpan.FromMinutes(1));
builder.Services.AddAuthorization(o => {
    o.AddPolicy("Admin", p => p.RequireRole(PortalRoles.All));
    o.AddPolicy("SuperAdmin", p => p.RequireRole(PortalRoles.Admin));
});
builder.Services.AddAntiforgery(o => {
    o.HeaderName = "X-CSRF-TOKEN"; o.Cookie.Name = "mta.csrf"; o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
});
var storage = Path.GetFullPath(builder.Configuration["StoragePath"] ?? Path.Combine(builder.Environment.ContentRootPath, "storage"));
Directory.CreateDirectory(Path.Combine(storage, "media"));
Directory.CreateDirectory(Path.Combine(storage, "keys"));
builder.Services.AddDataProtection().SetApplicationName("Mta.Api").PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(storage, "keys")));
builder.Services.AddRateLimiter(o => {
    o.RejectionStatusCode = 429;
    o.AddPolicy("login", c => RateLimitPartition.GetFixedWindowLimiter(c.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.Configure<ForwardedHeadersOptions>(o => {
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    if (builder.Configuration["TrustedProxy"] is { Length: > 0 } ip) o.KnownProxies.Add(IPAddress.Parse(ip));
});
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 8 * 1024 * 1024);
builder.Services.AddProblemDetails();
var app = builder.Build();
app.UseForwardedHeaders();
app.UseExceptionHandler();
app.Use(async (ctx, next) => {
    ctx.Response.Headers.XContentTypeOptions = "nosniff";
    if (ctx.Request.Path.StartsWithSegments("/api/admin")) {
        ctx.Response.Headers.CacheControl = "no-store";
        ctx.Response.Headers["X-Robots-Tag"] = "noindex, nofollow";
    }
    await next();
});
app.UseStaticFiles(new StaticFileOptions {
    FileProvider = new PhysicalFileProvider(Path.Combine(storage, "media")), RequestPath = "/media",
    OnPrepareResponse = c => {
        c.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
        if (c.File.Name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            c.Context.Response.Headers.ContentDisposition = "attachment; filename=\"trail-map.pdf\"";
    }
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.Use(async (ctx, next) => {
    if (ctx.Request.Path.StartsWithSegments("/api/admin") && !HttpMethods.IsGet(ctx.Request.Method) && !HttpMethods.IsHead(ctx.Request.Method)) {
        try { await ctx.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(ctx); }
        catch (AntiforgeryValidationException) { ctx.Response.StatusCode = 400; await ctx.Response.WriteAsJsonAsync(new { message = "სესიის დაცვა ვერ შემოწმდა. განაახლეთ გვერდი." }); return; }
    }
    await next();
});

app.MapGet("/health", async (AppDb db) => await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ok" }) : Results.StatusCode(503));
app.MapGet("/api/admin/session", (HttpContext ctx, IAntiforgery csrf) => Results.Ok(new {
    authenticated = PortalRoles.All.Any(ctx.User.IsInRole), email = ctx.User.Identity?.Name,
    id = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier),
    role = PortalRoles.All.FirstOrDefault(ctx.User.IsInRole),
    csrfToken = csrf.GetAndStoreTokens(ctx).RequestToken
}));
app.MapPost("/api/admin/login", async (LoginInput input, SignInManager<PortalUser> signIn, UserManager<PortalUser> users) => {
    if (string.IsNullOrWhiteSpace(input.Email) || input.Email.Length > 254 || string.IsNullOrEmpty(input.Password) || input.Password.Length > 256) return Results.Unauthorized();
    var user = await users.FindByEmailAsync(input.Email);
    if (user == null || !(await users.GetRolesAsync(user)).Any(PortalRoles.All.Contains)) return Results.Unauthorized();
    var result = await signIn.PasswordSignInAsync(user, input.Password, false, true);
    return result.Succeeded ? Results.Ok(new { message = "ok" }) : Results.Unauthorized();
}).RequireRateLimiting("login");
app.MapPost("/api/admin/logout", async (SignInManager<PortalUser> signIn) => { await signIn.SignOutAsync(); return Results.NoContent(); }).RequireAuthorization("Admin");

app.MapGet("/api/news", async (string? locale, AppDb db, HttpContext ctx) => {
    if (locale != null && locale is not ("ka" or "en")) return Results.BadRequest();
    ctx.Response.Headers.CacheControl = "no-store";
    var items = await db.News.AsNoTracking().Where(n => n.Published).OrderByDescending(n => n.Date).ThenByDescending(n => n.UpdatedAt).ToListAsync();
    return Results.Ok(items.Select(n => n.Localized(locale ?? "ka")));
});
app.MapGet("/api/news/{slug}", async (string slug, string? locale, AppDb db, HttpContext ctx) => {
    if (locale != null && locale is not ("ka" or "en")) return Results.BadRequest();
    ctx.Response.Headers.CacheControl = "no-store";
    var item = await db.News.AsNoTracking().SingleOrDefaultAsync(n => n.Slug == slug && n.Published);
    return item == null ? Results.NotFound() : Results.Ok(item.Localized(locale ?? "ka"));
});
var admin = app.MapGroup("/api/admin").RequireAuthorization("Admin");
admin.MapUsers();
app.MapResorts(admin);
app.MapFaqs(admin);
admin.MapGet("/news", async (AppDb db) => await db.News.AsNoTracking().OrderByDescending(n => n.Date).ThenByDescending(n => n.UpdatedAt).ToListAsync());
admin.MapPost("/news", async (NewsInput input, AppDb db, HttpContext ctx) => {
    var errors = input.Validate(); if (errors.Count > 0) return Results.ValidationProblem(errors);
    var news = new News(); input.Apply(news); db.News.Add(news); Audit(db, ctx, "create", news.Id);
    return await Save(db) ? Results.Created($"/api/admin/news/{news.Id}", news) : Conflict();
});
admin.MapPut("/news/{id:guid}", async (Guid id, NewsInput input, AppDb db, HttpContext ctx) => {
    var errors = input.Validate(); if (errors.Count > 0) return Results.ValidationProblem(errors);
    var news = await db.News.FindAsync(id); if (news == null) return Results.NotFound();
    if (input.Version != news.Version) return Conflict();
    if (news.Slug != input.Slug) return Results.BadRequest(new { message = "არსებული ნიუსის მისამართი უცვლელია, რათა ბმულები არ დაიკარგოს." });
    input.Apply(news); Audit(db, ctx, "update", id);
    return await Save(db) ? Results.Ok(news) : Conflict();
});
admin.MapDelete("/news/{id:guid}", async (Guid id, Guid version, AppDb db, HttpContext ctx) => {
    var news = await db.News.FindAsync(id); if (news == null) return Results.NotFound();
    if (news.Version != version) return Conflict();
    db.News.Remove(news); Audit(db, ctx, "delete", id);
    return await Save(db) ? Results.NoContent() : Conflict();
});
admin.MapPost("/media", async (HttpRequest request) => {
    if (!request.HasFormContentType) return Results.BadRequest(new { message = "აირჩიეთ ფოტო." });
    var form = await request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file == null || file.Length is < 12 or > 5 * 1024 * 1024) return Results.BadRequest(new { message = "ფოტოს ზომა უნდა იყოს მაქსიმუმ 5 MB." });
    await using var stream = file.OpenReadStream();
    var header = new byte[12]; await stream.ReadExactlyAsync(header);
    string? ext = header.AsSpan(0, 3).SequenceEqual(new byte[] { 255, 216, 255 }) ? ".jpg"
        : header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? ".png"
        : System.Text.Encoding.ASCII.GetString(header, 0, 4) == "RIFF" && System.Text.Encoding.ASCII.GetString(header, 8, 4) == "WEBP" ? ".webp" : null;
    if (ext == null) return Results.BadRequest(new { message = "დასაშვებია მხოლოდ JPG, PNG და WebP ფოტოები." });
    var name = Guid.NewGuid().ToString("N") + ext;
    await using var output = File.Create(Path.Combine(storage, "media", name));
    await output.WriteAsync(header); await stream.CopyToAsync(output);
    return Results.Ok(new { url = "/media/" + name });
});
admin.MapPost("/resort-pdf", async (HttpRequest request) => {
    if (!request.HasFormContentType) return Results.BadRequest();
    var form = await request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file == null || file.Length < 8 || file.Length > 5 * 1024 * 1024)
        return Results.BadRequest(new { message = "PDF only, maximum 5 MB." });
    await using var stream = file.OpenReadStream();
    var header = new byte[5]; await stream.ReadExactlyAsync(header);
    if (System.Text.Encoding.ASCII.GetString(header) != "%PDF-")
        return Results.BadRequest(new { message = "Invalid PDF." });
    var name = Guid.NewGuid().ToString("N") + ".pdf";
    await using var output = File.Create(Path.Combine(storage, "media", name));
    await output.WriteAsync(header); await stream.CopyToAsync(output);
    return Results.Ok(new { url = "/media/" + name });
});

admin.MapPost("/resort-video", async (HttpRequest request) => {
    if (!request.HasFormContentType) return Results.BadRequest();
    var file = (await request.ReadFormAsync()).Files.GetFile("file");
    if (file == null || file.Length < 16 || file.Length > 5 * 1024 * 1024)
        return Results.BadRequest(new { message = "MP4/WebM only, maximum 5 MB." });
    await using var stream = file.OpenReadStream();
    var header = new byte[16]; await stream.ReadExactlyAsync(header);
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    var valid = extension == ".mp4" && System.Text.Encoding.ASCII.GetString(header, 4, 4) == "ftyp"
        || extension == ".webm" && header[0] == 0x1a && header[1] == 0x45 && header[2] == 0xdf && header[3] == 0xa3;
    if (!valid) return Results.BadRequest(new { message = "Invalid MP4/WebM file." });
    var name = Guid.NewGuid().ToString("N") + extension;
    await using var output = File.Create(Path.Combine(storage, "media", name));
    await output.WriteAsync(header); await stream.CopyToAsync(output);
    return Results.Ok(new { url = "/media/" + name });
});

// Explicit initialization command; normal startup never changes schema or recreates deleted news.
if (args.Contains("--initialize")) {
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    await db.Database.MigrateAsync();
    var users = scope.ServiceProvider.GetRequiredService<UserManager<PortalUser>>();
    var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in PortalRoles.All) {
        if (!await roles.RoleExistsAsync(role)) {
            var r = await roles.CreateAsync(new IdentityRole(role)); if (!r.Succeeded) throw new Exception("Role creation failed.");
        }
    }
    // Upgrade accounts from the first local CMS version without retaining a legacy bypass role.
    if (await roles.RoleExistsAsync("Admin")) {
        foreach (var legacy in await users.GetUsersInRoleAsync("Admin")) {
            if (!await users.IsInRoleAsync(legacy, PortalRoles.Admin)) await users.AddToRoleAsync(legacy, PortalRoles.Admin);
            await users.RemoveFromRoleAsync(legacy, "Admin"); await users.UpdateSecurityStampAsync(legacy);
        }
    }
    var email = builder.Configuration["Bootstrap:Email"] ?? throw new Exception("Bootstrap__Email is required.");
    var user = await users.FindByEmailAsync(email);
    if (user == null) {
        var password = builder.Configuration["Bootstrap:Password"] ?? throw new Exception("Bootstrap__Password is required.");
        user = new PortalUser { UserName = email, Email = email, DisplayName = "Super Admin", EmailConfirmed = true };
        var result = await users.CreateAsync(user, password);
        if (!result.Succeeded) throw new Exception(string.Join("; ", result.Errors.Select(e => e.Description)));
    }
    if (!await users.IsInRoleAsync(user, PortalRoles.Admin)) {
        var result = await users.AddToRoleAsync(user, PortalRoles.Admin); if (!result.Succeeded) throw new Exception("Admin assignment failed.");
    }
    if (!await db.Bootstrap.AnyAsync(s => s.Id == "initial-news")) {
        if (!await db.News.AnyAsync()) {
            var json = await File.ReadAllTextAsync(Path.Combine(app.Environment.ContentRootPath, "seed-news.json"));
            var seed = JsonSerializer.Deserialize<List<News>>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
            db.News.AddRange(seed);
        }
        db.Bootstrap.Add(new BootstrapState { Id = "initial-news" }); await db.SaveChangesAsync();
    }
    if (!await db.Bootstrap.AnyAsync(s => s.Id == "initial-resorts")) {
        if (!await db.Resorts.AnyAsync()) {
            var json = await File.ReadAllTextAsync(Path.Combine(app.Environment.ContentRootPath, "seed-resorts.json"));
            var seed = JsonSerializer.Deserialize<List<Resort>>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
            db.Resorts.AddRange(seed);
        }
        db.Bootstrap.Add(new BootstrapState { Id = "initial-resorts" }); await db.SaveChangesAsync();
    }
    Console.WriteLine("Database initialized. Existing passwords and content were preserved.");
    return;
}
app.Run();

static void Audit(AppDb db, HttpContext ctx, string action, Guid id) => db.Audit.Add(new AuditEntry { Actor = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown", Action = action, NewsId = id });
static IResult Conflict() => Results.Conflict(new { message = "მისამართი უკვე გამოიყენება ან ნიუსი სხვა სესიიდან შეიცვალა. განაახლეთ სია." });
static async Task<bool> Save(AppDb db) {
    try { await db.SaveChangesAsync(); return true; }
    catch (DbUpdateConcurrencyException) { return false; }
    catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: "23505" }) { return false; }
}
record LoginInput(string? Email, string? Password);
