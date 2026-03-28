using System.Text;
using AspNetCoreRateLimit;
using GymApi.Data;
using GymApi.Middlewares;
using GymApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration));

    // ── Port ─────────────────────────────────────────────────
    builder.WebHost.UseUrls("http://localhost:5000", "http://0.0.0.0:5000");

    // ── Database ─────────────────────────────────────────────
    builder.Services.AddDbContext<GymDbContext>(opt =>
        opt.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sql => sql.EnableRetryOnFailure(3)));

    // ── JWT ──────────────────────────────────────────────────
    var jwtSection = builder.Configuration.GetSection("JwtSettings");
    var secretBytes = Encoding.UTF8.GetBytes(jwtSection["SecretKey"] ?? "GymProSuperSecretKey2024ABCDEFGHIJ");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSection["Issuer"] ?? "GymManagementAPI",
                ValidAudience = jwtSection["Audience"] ?? "GymManagementClient",
                IssuerSigningKey = new SymmetricSecurityKey(secretBytes),
                ClockSkew = TimeSpan.Zero
            };
        });

    builder.Services.AddAuthorization();

    // ── CORS ─────────────────────────────────────────────────
    builder.Services.AddCors(opt => opt.AddPolicy("GymPolicy",
        p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

    // ── Rate Limiting ────────────────────────────────────────
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(
        builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddInMemoryRateLimiting();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

    // ── Services ─────────────────────────────────────────────
    builder.Services.AddScoped<IJwtService, JwtService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddHttpContextAccessor();

    // ── Controllers (camelCase JSON) ─────────────────────────
    builder.Services.AddControllers().AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

    // ── Swagger ──────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "GymPro Management API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT: Bearer {token}",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement {{
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            }, Array.Empty<string>()
        }});
    });

    builder.Services.AddResponseCompression(opt => opt.EnableForHttps = true);

    var app = builder.Build();

    app.UseResponseCompression();
    app.UseIpRateLimiting();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "GymPro API v1"));
    app.UseMiddleware<ExceptionMiddleware>();
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseSerilogRequestLogging();

    // Static files (frontend) — MUST be before auth middleware
    app.UseDefaultFiles();
    app.UseStaticFiles();

    app.UseCors("GymPolicy");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    Log.Information("GymPro API starting on http://localhost:5000");
    app.Run();
}
catch (Exception ex) { Log.Fatal(ex, "Startup failed"); }
finally { Log.CloseAndFlush(); }