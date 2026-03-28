using System.Text.Json;

namespace GymApi.Middlewares;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            ctx.Response.ContentType  = "application/json";
            ctx.Response.StatusCode   = 500;
            var payload = JsonSerializer.Serialize(new
            {
                success = false,
                message = ex.Message,
                traceId = ctx.TraceIdentifier
            }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await ctx.Response.WriteAsync(payload);
        }
    }
}

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try { await next(ctx); }
        finally
        {
            sw.Stop();
            logger.LogInformation("{Method} {Path} → {Status} in {Ms}ms",
                ctx.Request.Method, ctx.Request.Path, ctx.Response.StatusCode, sw.ElapsedMilliseconds);
        }
    }
}
