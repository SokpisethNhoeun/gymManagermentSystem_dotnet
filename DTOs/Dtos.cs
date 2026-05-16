using System.ComponentModel.DataAnnotations;

namespace GymApi.DTOs;

// ── API Response wrapper ───────────────────────────────────
public record ApiResponse<T>(bool Success, string? Message, T? Data)
{
    public static ApiResponse<T> Ok(T data, string? msg = null) => new(true, msg, data);
    public static ApiResponse<T> Fail(string msg) => new(false, msg, default);
}

// ── Paged result ───────────────────────────────────────────
public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

// ── AUTH ──────────────────────────────────────────────────
public record LoginRequest([Required] string Username, [Required] string Password);
public record LoginResponse(string Token, int UserId, string FullName, string Email, string Role, int RoleId);
public record OtpStartResponse(string OtpToken, string Email, DateTime ExpiresAt, string Purpose);
public record VerifyOtpRequest(
    [Required] string OtpToken,
    [Required, RegularExpression(@"^\d{6}$", ErrorMessage = "OTP code must be exactly 6 digits.")] string Code);

// ── USER ──────────────────────────────────────────────────
public record UserDto(int UserId, string FullName, string Username, string? Gender,
    string Email, string RoleName, bool IsActive, DateTime CreateAt);

public record CreateUserRequest(
    [Required, MaxLength(100)] string FullName,
    [Required, MaxLength(100)] string Username,
    [MaxLength(1)] string? Gender,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Range(1, 4)] int RoleId);

public record UpdateUserRequest(
    [Required, MaxLength(100)] string FullName,
    [MaxLength(1)] string? Gender,
    [Required, EmailAddress] string Email,
    bool IsActive);

public record ResetPasswordRequest([Required, MinLength(6)] string NewPassword);

// ── SELF-PROFILE ──────────────────────────────────────────
// PUT /api/members/me — clients update their own User + ClientDetail in one call
public record UpdateMyProfileRequest(
    [Required, MaxLength(100)] string FullName,
    [Required, EmailAddress, MaxLength(100)] string Email,
    [MaxLength(1)] string? Gender,
    [MaxLength(50)] string? Phone,
    DateTime? Dob,
    [MaxLength(255)] string? EmergencyContact);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(6)] string NewPassword);

// POST /api/members/{id}/promote — Admin promotes a member to Trainer or Staff
public record PromoteMemberRequest(
    [Required, RegularExpression("Trainer|Staff", ErrorMessage = "Role must be Trainer or Staff.")] string Role,
    List<int>? SkillIds,
    [Range(0, 9999999)] decimal? Salary,
    DateTime? Dob,
    [MaxLength(100)] string? PlaceOfBirth,
    [MaxLength(50)] string? Phone);

// POST /api/trainers/{id}/skills — Admin adds a skill to an existing trainer
public record AddTrainerSkillRequest([Range(1, int.MaxValue)] int SkillId);

// ── STAFF ─────────────────────────────────────────────────
public record StaffDto(int StaffId, int UserId, string FullName, string Email,
    string? Phone, string? PlaceOfBirth, DateTime? Dob, decimal Salary, bool IsActive);

public record CreateStaffRequest(
    [Required, MaxLength(100)] string FullName,
    [Required, MaxLength(100)] string Username,
    [MaxLength(1)] string? Gender,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [MaxLength(50)] string? Phone,
    [MaxLength(100)] string? PlaceOfBirth,
    DateTime? Dob,
    [Range(0, 9999999)] decimal Salary);

public record UpdateStaffRequest(
    [MaxLength(50)] string? Phone,
    [MaxLength(100)] string? PlaceOfBirth,
    DateTime? Dob,
    [Range(0, 9999999)] decimal Salary,
    bool IsActive);

// ── CLIENT ────────────────────────────────────────────────
public record ClientDto(int ClientId, int UserId, string FullName, string Email,
    string? Phone, DateTime? Dob, string? EmergencyContact, bool IsActive);

public record CreateClientRequest(
    [Required, MaxLength(100)] string FullName,
    [Required, MaxLength(100)] string Username,
    [MaxLength(1)] string? Gender,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [MaxLength(50)] string? Phone,
    DateTime? Dob,
    [MaxLength(255)] string? EmergencyContact);

// ── MEMBERSHIP ────────────────────────────────────────────
public record MembershipDto(int MembershipId, int ClientId, string ClientName,
    string Type, decimal Price, DateTime StartAt, DateTime ExpireAt, bool IsActive);

public record CreateMembershipRequest(
    [Range(1, int.MaxValue)] int ClientId,
    [Required, MaxLength(55)] string Type,
    [Range(0, 99999)] decimal Price,
    DateTime StartAt,
    DateTime ExpireAt);

// ── TRAINER ───────────────────────────────────────────────
public record TrainerDto(int TrainerId, int UserId, string FullName,
    string Email, bool IsActive, List<string> Skills);

public record CreateTrainerRequest(
    [Required, MaxLength(100)] string FullName,
    [Required, MaxLength(100)] string Username,
    [MaxLength(1)] string? Gender,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    List<int> SkillIds);

// ── COURSE ────────────────────────────────────────────────
public record CourseDto(int CourseId, string CourseName, string TrainerName,
    string SkillName, decimal Price, string? Description, bool IsActive, int EnrollmentCount);

public record CreateCourseRequest(
    [Required, MaxLength(100)] string CourseName,
    [Range(1, int.MaxValue)] int TrainerId,
    [Range(1, int.MaxValue)] int SkillId,
    [Range(0, 99999)] decimal Price,
    [MaxLength(500)] string? Description);

// ── ENROLLMENT ────────────────────────────────────────────
public record EnrollmentDto(int EnrollmentId, int CourseId, string CourseName,
    int ClientId, string ClientName, DateTime StartAt, DateTime ExpireAt, decimal Amount,
    bool IsApproved, int? ApprovedBy, DateTime? ApprovedAt);

// Staff approves/rejects a pending enrollment
public record ApproveEnrollmentRequest(bool Approve);

public record CreateEnrollmentRequest(
    [Range(1, int.MaxValue)] int CourseId,
    [Range(1, int.MaxValue)] int ClientId,
    DateTime StartAt,
    DateTime ExpireAt,
    [Range(0, 99999)] decimal Amount);

// ── CHECK-IN ──────────────────────────────────────────────
// checkinDate maps to DailyCustomerTracking.CheckinDate
public record CheckInDto(int TrackingId, int ClientId, string ClientName,
    DateTime CheckinDate, decimal Amount);

public record CheckInRequest(
    [Range(1, int.MaxValue)] int ClientId,
    [Range(0, 99999)] decimal Amount);

// ── DASHBOARD ─────────────────────────────────────────────
// These exact camelCase names are what the frontend reads after normalize()
public record DashboardStats(
    int TotalMembers,
    int TotalTrainers,
    int TotalStaff,
    int ActiveMemberships,
    int TodayCheckIns,
    decimal MonthlyRevenue,
    int TotalActiveUsers,
    List<RevenuePoint> RevenueChart);

public record RevenuePoint(string Month, decimal Revenue);

// ── SKILL ─────────────────────────────────────────────────
public record SkillDto(int SkillId, string SkillName);
public record CreateSkillRequest([Required, MaxLength(50)] string SkillName);

// ── MEMBERSHIP PLAN DEFINITIONS ───────────────────────────────
public record MembershipPlanDto(int PlanId, string Type, string? Description,
    decimal Price, int DurationMonths, bool IsActive);

public record CreateMembershipPlanRequest(
    [Required, MaxLength(55)] string Type,
    [MaxLength(500)] string? Description,
    [Range(0, 99999)] decimal Price,
    [Range(1, 120)] int DurationMonths);

public record UpdateMembershipPlanRequest(
    [Required, MaxLength(55)] string Type,
    [MaxLength(500)] string? Description,
    [Range(0, 99999)] decimal Price,
    [Range(1, 120)] int DurationMonths,
    bool IsActive);

// ── PAYMENTS / KHQR ───────────────────────────────────────
public record KhqrMembershipPaymentRequest(
    [Range(1, int.MaxValue)] int ClientId,
    [Required, MaxLength(55)] string Type,
    [Range(0.01, 99999)] decimal Price,
    DateTime StartAt,
    DateTime ExpireAt,
    [RegularExpression("USD|KHR", ErrorMessage = "Currency must be USD or KHR.")] string Currency = "USD",
    int? PlanId = null);

public record KhqrCoursePaymentRequest(
    [Range(1, int.MaxValue)] int ClientId,
    [Range(1, int.MaxValue)] int CourseId,
    [RegularExpression("USD|KHR", ErrorMessage = "Currency must be USD or KHR.")] string Currency = "USD");

public record KhqrPaymentDto(
    int PaymentId,
    int? ClientId,
    string Purpose,
    decimal Amount,
    string Currency,
    string Status,
    string Provider,
    string Reference,
    string? ProviderReference,
    string? Md5Hash,
    string? QrPayload,
    string? QrImageDataUri,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    DateTime? PaidAt,
    int? MembershipId,
    int? EnrollmentId,
    string? OrderName);

public record ConfirmPaymentRequest([MaxLength(255)] string? ProviderReference);
