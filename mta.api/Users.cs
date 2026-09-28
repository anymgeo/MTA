using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Mta.Api;

public static class PortalRoles
{
    public const string Admin = "WebPortalAdmin";
    public const string Moderator = "WebPortalModerator";
    public static readonly string[] All = [Admin, Moderator];
}

public record UserInput(string? Email, string? DisplayName, string? Role, string? Password, string? Version, string? CurrentPassword);

public static class UserEndpoints
{
    public static void MapUsers(this RouteGroupBuilder admin)
    {
        admin.MapGet("/users", async (UserManager<PortalUser> users) => {
            var records = await users.Users.OrderBy(u => u.Email).ToListAsync();
            var result = new List<object>();
            foreach (var user in records) result.Add(await View(user, users));
            return Results.Ok(result);
        });
        admin.MapPost("/users", async (UserInput input, UserManager<PortalUser> users, AppDb db) => {
            var error = Validate(input, true); if (error != null) return error;
            await using var transaction = await db.Database.BeginTransactionAsync();
            await Lock(db);
            var user = new PortalUser { UserName = input.Email!.Trim(), Email = input.Email.Trim(), DisplayName = input.DisplayName!.Trim(), EmailConfirmed = true };
            var created = await users.CreateAsync(user, input.Password!);
            if (!created.Succeeded) return Invalid(created);
            var assigned = await users.AddToRoleAsync(user, input.Role!);
            if (!assigned.Succeeded) return Invalid(assigned);
            await transaction.CommitAsync();
            return Results.Created($"/api/admin/users/{user.Id}", await View(user, users));
        }).RequireAuthorization("SuperAdmin");

        admin.MapPut("/users/{id}", async (string id, UserInput input, UserManager<PortalUser> users, SignInManager<PortalUser> signIn, AppDb db, HttpContext ctx) => {
            var error = Validate(input, false); if (error != null) return error;
            await using var transaction = await db.Database.BeginTransactionAsync();
            await Lock(db);
            var user = await users.FindByIdAsync(id); if (user == null) return Results.NotFound();
            if (input.Version != user.ConcurrencyStamp) return Conflict();
            var oldRole = (await users.GetRolesAsync(user)).FirstOrDefault(PortalRoles.All.Contains);
            var isSuper = ctx.User.IsInRole(PortalRoles.Admin);
            var isSelf = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) == id;
            // Editing a profile is allowed for moderators; assigning privileges or
            // resetting someone else's credentials would bypass their restrictions.
            if (!isSuper && input.Role != oldRole) return Results.Forbid();
            if (!isSuper && !isSelf && !string.IsNullOrEmpty(input.Password)) return Results.Forbid();
            if (oldRole == PortalRoles.Admin && input.Role != oldRole && (await users.GetUsersInRoleAsync(PortalRoles.Admin)).Count <= 1)
                return Results.BadRequest(new { message = "სისტემას მინიმუმ ერთი Super Admin უნდა დარჩეს." });
            if (!string.IsNullOrEmpty(input.Password)) {
                IdentityResult changed;
                if (isSuper) changed = await users.ResetPasswordAsync(user, await users.GeneratePasswordResetTokenAsync(user), input.Password);
                else if (string.IsNullOrEmpty(input.CurrentPassword)) return Results.BadRequest(new { message = "საკუთარი პაროლის შესაცვლელად შეიყვანეთ მიმდინარე პაროლი." });
                else changed = await users.ChangePasswordAsync(user, input.CurrentPassword, input.Password);
                if (!changed.Succeeded) return Invalid(changed);
            }
            user.DisplayName = input.DisplayName!.Trim(); user.Email = input.Email!.Trim(); user.UserName = user.Email;
            var updated = await users.UpdateAsync(user); if (!updated.Succeeded) return Invalid(updated);
            if (input.Role != oldRole) {
                var removed = await users.RemoveFromRolesAsync(user, await users.GetRolesAsync(user));
                if (!removed.Succeeded) return Invalid(removed);
                var added = await users.AddToRoleAsync(user, input.Role!); if (!added.Succeeded) return Invalid(added);
            }
            // Revoke old sessions immediately after all account edits.
            var stamp = await users.UpdateSecurityStampAsync(user); if (!stamp.Succeeded) return Invalid(stamp);
            await transaction.CommitAsync();
            if (isSelf) await signIn.RefreshSignInAsync(user);
            return Results.Ok(await View(user, users));
        });
        admin.MapDelete("/users/{id}", async (string id, string version, UserManager<PortalUser> users, SignInManager<PortalUser> signIn, AppDb db, HttpContext ctx) => {
            await using var transaction = await db.Database.BeginTransactionAsync();
            await Lock(db);
            var user = await users.FindByIdAsync(id); if (user == null) return Results.NotFound();
            if (version != user.ConcurrencyStamp) return Conflict();
            if (await users.IsInRoleAsync(user, PortalRoles.Admin) && (await users.GetUsersInRoleAsync(PortalRoles.Admin)).Count <= 1)
                return Results.BadRequest(new { message = "ბოლო Super Admin-ის წაშლა შეუძლებელია. ჯერ დაამატეთ სხვა Super Admin." });
            var result = await users.DeleteAsync(user); if (!result.Succeeded) return Invalid(result);
            await transaction.CommitAsync();
            if (ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) == id) await signIn.SignOutAsync();
            return Results.NoContent();
        }).RequireAuthorization("SuperAdmin");
    }

    private static async Task<object> View(PortalUser user, UserManager<PortalUser> users) => new {
        user.Id, user.Email, user.DisplayName, role = (await users.GetRolesAsync(user)).FirstOrDefault(PortalRoles.All.Contains), version = user.ConcurrencyStamp
    };
    private static IResult? Validate(UserInput input, bool creating)
    {
        if (string.IsNullOrWhiteSpace(input.Email) || input.Email.Length > 254 || !new EmailAddressAttribute().IsValid(input.Email.Trim()))
            return Results.BadRequest(new { message = "მიუთითეთ სწორი ელფოსტა." });
        if (string.IsNullOrWhiteSpace(input.DisplayName) || input.DisplayName.Length > 120)
            return Results.BadRequest(new { message = "სახელი აუცილებელია (მაქსიმუმ 120 სიმბოლო)." });
        if (!PortalRoles.All.Contains(input.Role)) return Results.BadRequest(new { message = "აირჩიეთ მოქმედი როლი." });
        if ((creating && string.IsNullOrEmpty(input.Password)) || input.Password?.Length > 256)
            return Results.BadRequest(new { message = "პაროლი აუცილებელია და არ უნდა აღემატებოდეს 256 სიმბოლოს." });
        return null;
    }
    private static IResult Invalid(IdentityResult result) => Results.BadRequest(new {
        message = string.Join(" ", result.Errors.Select(e => e.Code switch {
            "DuplicateEmail" or "DuplicateUserName" => "ეს ელფოსტა უკვე გამოიყენება.",
            "PasswordMismatch" => "მიმდინარე პაროლი არასწორია.",
            "ConcurrencyFailure" => "ანგარიში უკვე შეიცვალა. განაახლეთ სია.",
            _ when e.Code.StartsWith("Password") => "პაროლი უნდა შეიცავდეს მინიმუმ 12 სიმბოლოს, დიდ და პატარა ასოს, ციფრსა და სპეციალურ სიმბოლოს.",
            _ => "ანგარიშის შენახვა ვერ მოხერხდა. შეამოწმეთ მონაცემები."
        }).Distinct())
    });
    private static IResult Conflict() => Results.Conflict(new { message = "მომხმარებელი სხვა სესიიდან შეიცვალა. განაახლეთ სია." });
    // Serialize administrative account writes, including last-admin checks.
    private static Task Lock(AppDb db) => db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(74123001)");
}
