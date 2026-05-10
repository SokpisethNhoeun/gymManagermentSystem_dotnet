using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GymApi.Data;
using GymApi.DTOs;
using GymApi.Models;
using kh.gov.nbc.bakong_khqr;
using kh.gov.nbc.bakong_khqr.model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QRCoder;

namespace GymApi.Services;

public class EmailOptions
{
    public bool Enabled { get; set; }
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string FromName { get; set; } = "GymPro";
    public int OtpExpiresMinutes { get; set; } = 5;
}

public interface IEmailSender
{
    Task SendOtpAsync(User user, string code, string purpose, DateTime expiresAt);
}

public class GmailEmailSender(IOptions<EmailOptions> options, ILogger<GmailEmailSender> logger) : IEmailSender
{
    private readonly EmailOptions _options = options.Value;

    public async Task SendOtpAsync(User user, string code, string purpose, DateTime expiresAt)
    {
        if (!_options.Enabled)
        {
            logger.LogWarning("Email disabled. OTP for {Email} ({Purpose}) is {Code}", user.Email, purpose, code);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.Username) || string.IsNullOrWhiteSpace(_options.Password))
            throw new InvalidOperationException("Gmail SMTP is enabled but Email:Username or Email:Password is missing.");

        using var msg = new MailMessage
        {
            From = new MailAddress(
                string.IsNullOrWhiteSpace(_options.FromEmail) ? _options.Username : _options.FromEmail,
                _options.FromName),
            Subject = $"Your GymPro {purpose} verification code",
            IsBodyHtml = true,
            Body = BuildOtpTemplate(user.FullName, code, purpose, expiresAt)
        };
        msg.To.Add(new MailAddress(user.Email, user.FullName));

        using var smtp = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.EnableSsl,
            Credentials = new NetworkCredential(_options.Username, _options.Password)
        };
        await smtp.SendMailAsync(msg);
    }

    private static string BuildOtpTemplate(string name, string code, string purpose, DateTime expiresAt)
    {
        var title = purpose.Equals("Register", StringComparison.OrdinalIgnoreCase)
            ? "Confirm your new GymPro account"
            : "Confirm your GymPro sign in";
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(name) ? "GymPro user" : name);
        var expiry = expiresAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

        return $$"""
<!doctype html>
<html>
<body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#141820">
  <div style="max-width:520px;margin:0 auto;padding:32px 18px">
    <div style="background:#ffffff;border-radius:14px;padding:30px;border:1px solid #e8ecf5">
      <div style="font-size:22px;font-weight:800;margin-bottom:8px;color:#e8621a">GymPro</div>
      <h1 style="font-size:20px;margin:0 0 10px">{{title}}</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:#4f596b">Hi {{safeName}}, use this 6-digit code to continue. The code expires at {{expiry}}.</p>
      <div style="letter-spacing:10px;font-size:34px;font-weight:800;text-align:center;background:#111722;color:#ffffff;border-radius:12px;padding:18px 12px;margin:22px 0">{{code}}</div>
      <p style="font-size:12px;line-height:1.6;color:#7d8797;margin:0">If you did not request this code, ignore this email or contact the gym administrator.</p>
    </div>
  </div>
</body>
</html>
""";
    }
}

public record OtpVerificationResult(User User, string Purpose);

public interface IOtpService
{
    Task<OtpStartResponse> CreateChallengeAsync(User user, string purpose);
    Task<OtpVerificationResult?> VerifyAsync(string otpToken, string code, string? purpose = null);
}

public class OtpService(GymDbContext db, IEmailSender emailSender, IOptions<EmailOptions> options) : IOtpService
{
    private const int MaxAttempts = 5;
    private readonly EmailOptions _options = options.Value;

    public async Task<OtpStartResponse> CreateChallengeAsync(User user, string purpose)
    {
        var now = DateTime.UtcNow;
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6", CultureInfo.InvariantCulture);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var expiresAt = now.AddMinutes(Math.Max(1, _options.OtpExpiresMinutes));

        await db.OtpChallenges
            .Where(x => x.UserId == user.UserId && x.Purpose == purpose && x.ConsumedAt == null && x.ExpiresAt > now)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.ConsumedAt, now));

        db.OtpChallenges.Add(new OtpChallenge
        {
            UserId = user.UserId,
            Purpose = purpose,
            Email = user.Email,
            OtpTokenHash = HashToken(token),
            CodeHash = BCrypt.Net.BCrypt.HashPassword(code, workFactor: 10),
            ExpiresAt = expiresAt,
            CreatedAt = now
        });
        await db.SaveChangesAsync();
        await emailSender.SendOtpAsync(user, code, purpose, expiresAt);

        return new OtpStartResponse(token, MaskEmail(user.Email), expiresAt, purpose);
    }

    public async Task<OtpVerificationResult?> VerifyAsync(string otpToken, string code, string? purpose = null)
    {
        var now = DateTime.UtcNow;
        var tokenHash = HashToken(otpToken);
        var challenge = await db.OtpChallenges
            .Include(x => x.User).ThenInclude(u => u.Role)
            .AsTracking()
            .FirstOrDefaultAsync(x => x.OtpTokenHash == tokenHash);

        if (challenge == null) return null;
        if (purpose != null && !challenge.Purpose.Equals(purpose, StringComparison.OrdinalIgnoreCase))
            return null;
        if (challenge.ConsumedAt != null)
            throw new UnauthorizedAccessException("This OTP code was already used.");
        if (challenge.ExpiresAt <= now)
            throw new UnauthorizedAccessException("OTP code expired. Please request a new code.");
        if (challenge.Attempts >= MaxAttempts)
            throw new UnauthorizedAccessException("Too many invalid OTP attempts. Please request a new code.");

        challenge.Attempts++;
        if (!BCrypt.Net.BCrypt.Verify(code, challenge.CodeHash))
        {
            await db.SaveChangesAsync();
            return null;
        }

        challenge.ConsumedAt = now;
        challenge.User.EmailVerifiedAt ??= now;
        await db.SaveChangesAsync();
        return new OtpVerificationResult(challenge.User, challenge.Purpose);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@', 2);
        if (parts.Length != 2 || parts[0].Length <= 2) return email;
        return $"{parts[0][0]}***{parts[0][^1]}@{parts[1]}";
    }
}

public class KhqrOptions
{
    public string BakongAccountId { get; set; } = "merchant@bakong";
    public string MerchantName { get; set; } = "GymPro";
    public string MerchantCity { get; set; } = "Phnom Penh";
    public string CountryCode { get; set; } = "KH";
    public string MerchantCategoryCode { get; set; } = "7997";
    public string DefaultCurrency { get; set; } = "USD";
    public int PaymentExpiresMinutes { get; set; } = 10;
    public string ApiBaseUrl { get; set; } = "";
    public string ApiToken { get; set; } = "";
}

public interface IKhqrService
{
    string CreatePayload(decimal amount, string currency, string reference);
}

public class KhqrService(IOptions<KhqrOptions> options) : IKhqrService
{
    private readonly KhqrOptions _options = options.Value;

    public string CreatePayload(decimal amount, string currency, string reference)
    {
        var khqrCurrency = currency.Equals("KHR", StringComparison.OrdinalIgnoreCase)
            ? KHQRCurrency.KHR
            : KHQRCurrency.USD;

        var response = BakongKHQR.GenerateIndividual(new IndividualInfo
        {
            BakongAccountID = Clean(_options.BakongAccountId, 32),
            Currency = khqrCurrency,
            Amount = decimal.ToDouble(amount),
            MerchantName = Clean(_options.MerchantName, 25),
            MerchantCity = Clean(_options.MerchantCity, 15).ToUpperInvariant(),
            BillNumber = Clean(reference, 25),
            StoreLabel = "GymPro",
            TerminalLabel = "Web",
            ExpirationTimestamp = DateTimeOffset.UtcNow
                .AddMinutes(Math.Max(1, _options.PaymentExpiresMinutes))
                .ToUnixTimeMilliseconds()
        });

        if (response.Status.Code != 0 || string.IsNullOrWhiteSpace(response.Data?.QR))
            throw new InvalidOperationException(response.Status.Message ?? "Could not generate a valid Bakong KHQR payload.");

        return response.Data.QR;
    }

    private static string Clean(string value, int maxLength)
    {
        var ascii = new string((value ?? "").Where(c => c >= 32 && c <= 126).ToArray()).Trim();
        return ascii.Length <= maxLength ? ascii : ascii[..maxLength];
    }
}

public interface IQrCodeService
{
    string CreatePngDataUri(string payload);
}

public class QrCodeService : IQrCodeService
{
    public string CreatePngDataUri(string payload)
    {
        using var generator = new QRCodeGenerator();
        using var qrData = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrData);
        var bytes = qrCode.GetGraphic(12);
        return "data:image/png;base64," + Convert.ToBase64String(bytes);
    }
}

public interface IKhqrTransactionVerifier
{
    Task<bool> IsPaidAsync(string md5Hash, CancellationToken cancellationToken = default);
}

public class BakongTransactionVerifier(IHttpClientFactory httpClientFactory, IOptions<KhqrOptions> options)
    : IKhqrTransactionVerifier
{
    private readonly KhqrOptions _options = options.Value;

    public async Task<bool> IsPaidAsync(string md5Hash, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiBaseUrl) || string.IsNullOrWhiteSpace(_options.ApiToken))
            throw new InvalidOperationException("Bakong MD5 verification requires Khqr:ApiBaseUrl and Khqr:ApiToken.");

        var client = httpClientFactory.CreateClient("Bakong");
        client.BaseAddress = new Uri(_options.ApiBaseUrl.TrimEnd('/') + "/");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiToken);

        using var response = await client.PostAsJsonAsync(
            "v1/check_transaction_by_md5",
            new { md5 = md5Hash },
            cancellationToken);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Bakong verification failed: {(int)response.StatusCode} {raw}");

        using var doc = JsonDocument.Parse(raw);
        return LooksPaid(doc.RootElement);
    }

    private static bool LooksPaid(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("responseCode") && prop.Value.ValueKind == JsonValueKind.Number && prop.Value.GetInt32() == 0)
                    return true;
                if ((prop.NameEquals("status") || prop.NameEquals("transactionStatus") || prop.NameEquals("paymentStatus")) &&
                    prop.Value.ValueKind == JsonValueKind.String)
                {
                    var value = prop.Value.GetString();
                    if (value is "SUCCESS" or "PAID" or "COMPLETED") return true;
                }
                if (LooksPaid(prop.Value)) return true;
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
                if (LooksPaid(item)) return true;
        }

        return false;
    }
}
