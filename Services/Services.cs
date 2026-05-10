using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GymApi.Data;
using GymApi.DTOs;
using GymApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace GymApi.Services;

// ── JWT Service ───────────────────────────────────────────
public interface IJwtService
{
    string GenerateToken(User user, string roleName);
}

public class JwtService(IConfiguration config) : IJwtService
{
    private SymmetricSecurityKey Key =>
        new(Encoding.UTF8.GetBytes(
            config["JwtSettings:SecretKey"] ?? "GymProSuperSecretKey2024ABCDEFGHIJ"));

    public string GenerateToken(User user, string roleName)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name,               user.Username),
            new Claim(ClaimTypes.Role,               roleName),
            new Claim("user_id",   user.UserId.ToString()),
            new Claim("role_id",   user.RoleId.ToString()),
            new Claim("full_name", user.FullName)
        };

        var issuer   = config["JwtSettings:Issuer"]   ?? "GymManagementAPI";
        var audience = config["JwtSettings:Audience"] ?? "GymManagementClient";
        double expiry = 480;
        if (double.TryParse(config["JwtSettings:ExpiryMinutes"], out var p)) expiry = p;

        var token = new JwtSecurityToken(
            issuer:             issuer,
            audience:           audience,
            claims:             claims,
            notBefore:          DateTime.UtcNow,
            expires:            DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: new SigningCredentials(Key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ── Auth Service ──────────────────────────────────────────
public interface IAuthService
{
    Task<OtpStartResponse?> StartLoginAsync(string usernameOrEmail, string password);
    Task<OtpStartResponse> StartRegistrationOtpAsync(User user);
    Task<LoginResponse?> VerifyOtpAsync(string otpToken, string code);
}

public class AuthService(GymDbContext db, IJwtService jwt, IOtpService otp) : IAuthService
{
    public async Task<OtpStartResponse?> StartLoginAsync(string usernameOrEmail, string password)
    {
        var user = await db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Username == usernameOrEmail || u.Email == usernameOrEmail);

        if (user == null) return null;
        if (!user.IsActive) throw new UnauthorizedAccessException("Account is disabled.");
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;

        return await otp.CreateChallengeAsync(user, "Login");
    }

    public Task<OtpStartResponse> StartRegistrationOtpAsync(User user)
        => otp.CreateChallengeAsync(user, "Register");

    public async Task<LoginResponse?> VerifyOtpAsync(string otpToken, string code)
    {
        var result = await otp.VerifyAsync(otpToken, code);
        if (result == null) return null;

        var user = result.User;
        if (!user.IsActive) throw new UnauthorizedAccessException("Account is disabled.");

        var token = jwt.GenerateToken(user, user.Role.RoleName);
        return new LoginResponse(token, user.UserId, user.FullName, user.Email, user.Role.RoleName, user.RoleId);
    }
}

// ── Dashboard Service ─────────────────────────────────────
public interface IDashboardService
{
    Task<DashboardStats> GetStatsAsync();
}

public class DashboardService(GymDbContext db) : IDashboardService
{
    public async Task<DashboardStats> GetStatsAsync()
    {
        var today      = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var sixMonths  = today.AddMonths(-6);

        var members     = await db.ClientDetails.CountAsync();
        var trainers    = await db.Trainers.CountAsync(t => t.IsActive);
        var staff       = await db.StaffDetails.CountAsync(s => s.IsActive);
        var activeMembs = await db.ClientMemberships
                                  .CountAsync(m => m.IsActive && m.ExpireAt > DateTime.UtcNow);
        var todayCI     = await db.DailyCustomerTrackings
                                  .CountAsync(t => t.CheckinDate >= today);
        var monthRev    = await db.ClientMemberships
                                  .Where(m => m.StartAt >= monthStart)
                                  .SumAsync(m => (decimal?)m.Price) ?? 0;
        var activeUsers = await db.Users.IgnoreQueryFilters().CountAsync(u => u.IsActive);

        // Revenue chart — last 6 months
        var rawChart = await db.ClientMemberships
            .Where(m => m.StartAt >= sixMonths)
            .Select(m => new { m.StartAt.Year, m.StartAt.Month, m.Price })
            .ToListAsync();

        var chart = rawChart
            .GroupBy(m => new { m.Year, m.Month })
            .Select(g => new RevenuePoint(
                $"{g.Key.Year}-{g.Key.Month:D2}",
                g.Sum(m => m.Price)))
            .OrderBy(r => r.Month)
            .ToList();

        return new DashboardStats(members, trainers, staff, activeMembs,
                                  todayCI, monthRev, activeUsers, chart);
    }
}
