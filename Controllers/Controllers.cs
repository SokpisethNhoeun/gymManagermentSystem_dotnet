using GymApi.Data;
using GymApi.DTOs;
using GymApi.Models;
using GymApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymApi.Controllers;

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await auth.LoginAsync(req.Username, req.Password);
            if (result == null)
                return Unauthorized(ApiResponse<string>.Fail("Invalid username or password."));
            return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<string>.Fail(ex.Message));
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize]
public class UsersController(GymDbContext db) : ControllerBase
{
    [HttpGet, Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? roleId, [FromQuery] bool? isActive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var q = db.Users.IgnoreQueryFilters().Include(u => u.Role).AsQueryable();
        if (roleId.HasValue) q = q.Where(u => u.RoleId == roleId);
        if (isActive.HasValue) q = q.Where(u => u.IsActive == isActive);
        var total = await q.CountAsync();
        var items = await q.OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new UserDto(u.UserId, u.FullName, u.Username, u.Gender,
                u.Email, u.Role.RoleName, u.IsActive, u.CreateAt))
            .ToListAsync();
        return Ok(ApiResponse<PagedResult<UserDto>>.Ok(new PagedResult<UserDto>(items, total, page, pageSize)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var u = await db.Users.IgnoreQueryFilters().Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserId == id);
        if (u == null) return NotFound(ApiResponse<string>.Fail("User not found."));
        return Ok(ApiResponse<UserDto>.Ok(
            new UserDto(u.UserId, u.FullName, u.Username, u.Gender, u.Email, u.Role.RoleName, u.IsActive, u.CreateAt)));
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == req.Username))
            return Conflict(ApiResponse<string>.Fail("Username already exists."));
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == req.Email))
            return Conflict(ApiResponse<string>.Fail("Email already exists."));
        var user = new User
        {
            FullName = req.FullName,
            Username = req.Username,
            Gender = req.Gender,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, 11),
            RoleId = req.RoleId,
            IsActive = true
        };
        db.Users.Add(user); await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.UserId },
            ApiResponse<object>.Ok(new { user.UserId }, "User created."));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var u = await db.Users.IgnoreQueryFilters().AsTracking().FirstOrDefaultAsync(x => x.UserId == id);
        if (u == null) return NotFound(ApiResponse<string>.Fail("User not found."));
        u.FullName = req.FullName; u.Gender = req.Gender; u.Email = req.Email; u.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Updated."));
    }

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var u = await db.Users.IgnoreQueryFilters().AsTracking().FirstOrDefaultAsync(x => x.UserId == id);
        if (u == null) return NotFound(ApiResponse<string>.Fail("User not found."));
        u.IsActive = false; await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("User disabled."));
    }

    [HttpPatch("{id}/reset-password"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var u = await db.Users.IgnoreQueryFilters().AsTracking().FirstOrDefaultAsync(x => x.UserId == id);
        if (u == null) return NotFound(ApiResponse<string>.Fail("User not found."));
        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, 11);
        await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Password reset."));
    }
}

// ═══════════════════════════════════════════════════════════════
// MEMBERS
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize]
public class MembersController(GymDbContext db) : ControllerBase
{
    [HttpGet, Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive)
    {
        var q = db.ClientDetails.Include(c => c.User).AsQueryable();
        if (isActive.HasValue) q = q.Where(c => c.User.IsActive == isActive.Value);
        var items = await q.OrderBy(c => c.User.FullName)
            .Select(c => new ClientDto(c.ClientId, c.UserId, c.User.FullName, c.User.Email,
                c.Phone, c.Dob, c.EmergencyContact, c.User.IsActive))
            .ToListAsync();
        return Ok(ApiResponse<List<ClientDto>>.Ok(items));
    }

    // GET /api/members/me — returns the logged-in client's own record
    // Works for any authenticated role — Client uses this to find their own clientId
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst("user_id")?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(ApiResponse<string>.Fail("Invalid token."));

        var c = await db.ClientDetails.Include(x => x.User)
            .FirstOrDefaultAsync(x => x.UserId == userId);
        if (c == null)
            return NotFound(ApiResponse<string>.Fail("No client record for this account."));

        return Ok(ApiResponse<ClientDto>.Ok(
            new ClientDto(c.ClientId, c.UserId, c.User.FullName, c.User.Email,
                c.Phone, c.Dob, c.EmergencyContact, c.User.IsActive)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await db.ClientDetails.Include(x => x.User).FirstOrDefaultAsync(x => x.ClientId == id);
        if (c == null) return NotFound(ApiResponse<string>.Fail("Member not found."));
        return Ok(ApiResponse<ClientDto>.Ok(
            new ClientDto(c.ClientId, c.UserId, c.User.FullName, c.User.Email,
                c.Phone, c.Dob, c.EmergencyContact, c.User.IsActive)));
    }

    [HttpPost, Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == req.Username))
            return Conflict(ApiResponse<string>.Fail("Username exists."));
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == req.Email))
            return Conflict(ApiResponse<string>.Fail("Email exists."));
        var user = new User
        {
            FullName = req.FullName,
            Username = req.Username,
            Gender = req.Gender,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, 11),
            RoleId = 4
        };
        db.Users.Add(user); await db.SaveChangesAsync();
        var client = new ClientDetail { UserId = user.UserId, Dob = req.Dob, Phone = req.Phone, EmergencyContact = req.EmergencyContact };
        db.ClientDetails.Add(client); await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = client.ClientId },
            ApiResponse<object>.Ok(new { client.ClientId }));
    }

    [HttpGet("{id}/memberships")]
    public async Task<IActionResult> GetMemberships(int id)
    {
        var list = await db.ClientMemberships
            .Include(m => m.Client).ThenInclude(c => c.User)
            .Where(m => m.ClientId == id).OrderByDescending(m => m.StartAt)
            .Select(m => new MembershipDto(m.MembershipId, m.ClientId, m.Client.User.FullName,
                m.Type, m.Price, m.StartAt, m.ExpireAt, m.IsActive))
            .ToListAsync();
        return Ok(ApiResponse<List<MembershipDto>>.Ok(list));
    }

    [HttpGet("{id}/checkins")]
    public async Task<IActionResult> GetCheckIns(int id, [FromQuery] int days = 30)
    {
        var from = DateTime.UtcNow.AddDays(-days);
        var list = await db.DailyCustomerTrackings
            .Include(t => t.Client).ThenInclude(c => c.User)
            .Where(t => t.ClientId == id && t.CheckinDate >= from)
            .OrderByDescending(t => t.CheckinDate)
            .Select(t => new CheckInDto(t.TrackingId, t.ClientId, t.Client.User.FullName, t.CheckinDate, t.Amount))
            .ToListAsync();
        return Ok(ApiResponse<List<CheckInDto>>.Ok(list));
    }
}

// ═══════════════════════════════════════════════════════════════
// MEMBERSHIPS
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize(Roles = "Admin,Staff")]
public class MembershipsController(GymDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive, [FromQuery] string? type)
    {
        var q = db.ClientMemberships.Include(m => m.Client).ThenInclude(c => c.User).AsQueryable();
        if (isActive.HasValue) q = q.Where(m => m.IsActive == isActive);
        if (!string.IsNullOrEmpty(type)) q = q.Where(m => m.Type == type);
        var list = await q.OrderByDescending(m => m.StartAt)
            .Select(m => new MembershipDto(m.MembershipId, m.ClientId, m.Client.User.FullName,
                m.Type, m.Price, m.StartAt, m.ExpireAt, m.IsActive))
            .ToListAsync();
        return Ok(ApiResponse<List<MembershipDto>>.Ok(list));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMembershipRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (req.ExpireAt <= req.StartAt)
            return BadRequest(ApiResponse<string>.Fail("Expire date must be after start date."));
        var m = new ClientMembership
        {
            ClientId = req.ClientId,
            Type = req.Type,
            Price = req.Price,
            StartAt = req.StartAt,
            ExpireAt = req.ExpireAt,
            IsActive = true
        };
        db.ClientMemberships.Add(m); await db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { m.MembershipId }, "Membership created."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var m = await db.ClientMemberships.AsTracking().FirstOrDefaultAsync(x => x.MembershipId == id);
        if (m == null) return NotFound(ApiResponse<string>.Fail("Not found."));
        m.IsActive = false; await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Deactivated."));
    }
}

// ═══════════════════════════════════════════════════════════════
// CHECK-INS
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize(Roles = "Admin,Staff")]
public class CheckInsController(GymDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetToday()
    {
        var today = DateTime.UtcNow.Date;
        var list = await db.DailyCustomerTrackings
            .Include(t => t.Client).ThenInclude(c => c.User)
            .Where(t => t.CheckinDate >= today)
            .OrderByDescending(t => t.CheckinDate)
            .Select(t => new CheckInDto(t.TrackingId, t.ClientId, t.Client.User.FullName, t.CheckinDate, t.Amount))
            .ToListAsync();
        return Ok(ApiResponse<List<CheckInDto>>.Ok(list));
    }

    [HttpPost]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var tracking = new DailyCustomerTracking
        {
            ClientId = req.ClientId,
            CheckinDate = DateTime.UtcNow,
            Amount = req.Amount
        };
        db.DailyCustomerTrackings.Add(tracking); await db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { tracking.TrackingId }, "Checked in."));
    }
}

// ═══════════════════════════════════════════════════════════════
// STAFF
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize(Roles = "Admin")]
public class StaffController(GymDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.StaffDetails.Include(s => s.User).OrderBy(s => s.User.FullName)
            .Select(s => new StaffDto(s.StaffId, s.UserId, s.User.FullName, s.User.Email,
                s.Phone, s.PlaceOfBirth, s.Dob, s.Salary, s.IsActive))
            .ToListAsync();
        return Ok(ApiResponse<List<StaffDto>>.Ok(list));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == req.Username))
            return Conflict(ApiResponse<string>.Fail("Username exists."));
        var user = new User
        {
            FullName = req.FullName,
            Username = req.Username,
            Gender = req.Gender,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, 11),
            RoleId = 2
        };
        db.Users.Add(user); await db.SaveChangesAsync();
        var staff = new StaffDetail
        {
            UserId = user.UserId,
            Dob = req.Dob,
            Phone = req.Phone,
            PlaceOfBirth = req.PlaceOfBirth,
            Salary = req.Salary
        };
        db.StaffDetails.Add(staff); await db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { staff.StaffId }, "Staff created."));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateStaffRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var s = await db.StaffDetails.AsTracking().FirstOrDefaultAsync(x => x.StaffId == id);
        if (s == null) return NotFound(ApiResponse<string>.Fail("Not found."));
        s.Phone = req.Phone; s.PlaceOfBirth = req.PlaceOfBirth;
        s.Dob = req.Dob; s.Salary = req.Salary; s.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Updated."));
    }
}

// ═══════════════════════════════════════════════════════════════
// TRAINERS
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize]
public class TrainersController(GymDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.Trainers
            .Include(t => t.User)
            .Include(t => t.SkillMaps).ThenInclude(m => m.Skill)
            .OrderBy(t => t.User.FullName)
            .Select(t => new TrainerDto(t.TrainerId, t.UserId, t.User.FullName, t.User.Email,
                t.IsActive, t.SkillMaps.Select(m => m.Skill.SkillName).ToList()))
            .ToListAsync();
        return Ok(ApiResponse<List<TrainerDto>>.Ok(list));
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateTrainerRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == req.Username))
            return Conflict(ApiResponse<string>.Fail("Username exists."));
        var user = new User
        {
            FullName = req.FullName,
            Username = req.Username,
            Gender = req.Gender,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, 11),
            RoleId = 3
        };
        db.Users.Add(user); await db.SaveChangesAsync();
        var trainer = new Trainer { UserId = user.UserId };
        db.Trainers.Add(trainer); await db.SaveChangesAsync();
        if (req.SkillIds.Count > 0)
        {
            db.TrainerSkillMaps.AddRange(req.SkillIds.Distinct()
                .Select(sid => new TrainerSkillMap { TrainerId = trainer.TrainerId, SkillId = sid }));
            await db.SaveChangesAsync();
        }
        return Ok(ApiResponse<object>.Ok(new { trainer.TrainerId }, "Trainer created."));
    }

    [HttpPut("{id}/toggle"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(int id)
    {
        var t = await db.Trainers.AsTracking().FirstOrDefaultAsync(x => x.TrainerId == id);
        if (t == null) return NotFound(ApiResponse<string>.Fail("Not found."));
        t.IsActive = !t.IsActive; await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(t.IsActive ? "Activated." : "Deactivated."));
    }
}

// ═══════════════════════════════════════════════════════════════
// COURSES
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize]
public class CoursesController(GymDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive)
    {
        var q = db.Courses
            .Include(c => c.Trainer).ThenInclude(t => t.User)
            .Include(c => c.Skill)
            .Include(c => c.Enrollments)
            .AsQueryable();
        if (isActive.HasValue) q = q.Where(c => c.IsActive == isActive);
        var list = await q.OrderBy(c => c.CourseName)
            .Select(c => new CourseDto(c.CourseId, c.CourseName, c.Trainer.User.FullName,
                c.Skill.SkillName, c.Price, c.Description, c.IsActive, c.Enrollments.Count))
            .ToListAsync();
        return Ok(ApiResponse<List<CourseDto>>.Ok(list));
    }

    [HttpPost, Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create([FromBody] CreateCourseRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var course = new Course
        {
            CourseName = req.CourseName,
            TrainerId = req.TrainerId,
            SkillId = req.SkillId,
            Price = req.Price,
            Description = req.Description
        };
        db.Courses.Add(course); await db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { course.CourseId }, "Course created."));
    }

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var c = await db.Courses.AsTracking().FirstOrDefaultAsync(x => x.CourseId == id);
        if (c == null) return NotFound(ApiResponse<string>.Fail("Not found."));
        c.IsActive = false; await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Course deactivated."));
    }
}

// ═══════════════════════════════════════════════════════════════
// ENROLLMENTS
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize]
public class EnrollmentsController(GymDbContext db) : ControllerBase
{
    private EnrollmentDto ToDto(CourseRoom e) =>
        new(e.EnrollmentId, e.CourseId, e.Course.CourseName,
            e.ClientId, e.Client.User.FullName, e.StartAt, e.ExpireAt,
            e.Amount, e.IsApproved, e.ApprovedBy, e.ApprovedAt);

    // GET /api/enrollments?clientId=X&courseId=Y&isApproved=true/false
    // Admin/Staff can query any client. Client can only query their own.
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? clientId, [FromQuery] int? courseId,
        [FromQuery] bool? isApproved)
    {
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
        var userIdClaim = User.FindFirst("user_id")?.Value;

        if (role == "Client")
        {
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<string>.Fail("Invalid token."));
            var myClient = await db.ClientDetails.FirstOrDefaultAsync(c => c.UserId == userId);
            if (myClient == null)
                return NotFound(ApiResponse<string>.Fail("No client record found."));
            clientId = myClient.ClientId;
        }

        var q = db.CourseRooms
            .Include(e => e.Course)
            .Include(e => e.Client).ThenInclude(c => c.User)
            .AsQueryable();
        if (clientId.HasValue) q = q.Where(e => e.ClientId == clientId);
        if (courseId.HasValue) q = q.Where(e => e.CourseId == courseId);
        if (isApproved.HasValue) q = q.Where(e => e.IsApproved == isApproved);
        var list = await q.OrderByDescending(e => e.StartAt).ToListAsync();
        return Ok(ApiResponse<List<EnrollmentDto>>.Ok(list.Select(ToDto).ToList()));
    }

    // GET /api/enrollments/pending — Staff/Admin only, returns unapproved enrollments
    [HttpGet("pending"), Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetPending()
    {
        var list = await db.CourseRooms
            .Include(e => e.Course)
            .Include(e => e.Client).ThenInclude(c => c.User)
            .Where(e => !e.IsApproved)
            .OrderByDescending(e => e.StartAt)
            .ToListAsync();
        return Ok(ApiResponse<List<EnrollmentDto>>.Ok(list.Select(ToDto).ToList()));
    }

    // POST /api/enrollments — Client submits enrollment request (pending approval)
    // Admin/Staff enroll is auto-approved
    [HttpPost]
    public async Task<IActionResult> Enroll([FromBody] CreateEnrollmentRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
        var userIdClaim = User.FindFirst("user_id")?.Value;
        int.TryParse(userIdClaim, out var callerId);

        if (role == "Client")
        {
            var myClient = await db.ClientDetails.FirstOrDefaultAsync(c => c.UserId == callerId);
            if (myClient == null || myClient.ClientId != req.ClientId)
                return Forbid();
        }

        if (req.ExpireAt <= req.StartAt)
            return BadRequest(ApiResponse<string>.Fail("Expire must be after start."));
        if (await db.CourseRooms.AnyAsync(e => e.CourseId == req.CourseId && e.ClientId == req.ClientId))
            return Conflict(ApiResponse<string>.Fail("Already enrolled."));

        bool autoApprove = role == "Admin" || role == "Staff";
        var enrollment = new CourseRoom
        {
            CourseId = req.CourseId,
            ClientId = req.ClientId,
            StartAt = req.StartAt,
            ExpireAt = req.ExpireAt,
            Amount = req.Amount,
            IsApproved = autoApprove,
            ApprovedBy = autoApprove ? callerId : null,
            ApprovedAt = autoApprove ? DateTime.UtcNow : null,
        };
        db.CourseRooms.Add(enrollment); await db.SaveChangesAsync();
        var msg = autoApprove ? "Enrolled and approved." : "Enrollment request submitted — awaiting staff approval.";
        return Ok(ApiResponse<object>.Ok(new { enrollment.EnrollmentId, enrollment.IsApproved }, msg));
    }

    // PATCH /api/enrollments/{id}/approve — Staff/Admin approves or rejects
    [HttpPatch("{id}/approve"), Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveEnrollmentRequest req)
    {
        var e = await db.CourseRooms
            .Include(x => x.Course)
            .Include(x => x.Client).ThenInclude(c => c.User)
            .AsTracking()
            .FirstOrDefaultAsync(x => x.EnrollmentId == id);
        if (e == null) return NotFound(ApiResponse<string>.Fail("Enrollment not found."));

        var userIdClaim = User.FindFirst("user_id")?.Value;
        int.TryParse(userIdClaim, out var staffId);

        if (req.Approve)
        {
            e.IsApproved = true;
            e.ApprovedBy = staffId;
            e.ApprovedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Ok(ApiResponse<object>.Ok(ToDto(e), "Enrollment approved."));
        }
        else
        {
            // Reject = delete the enrollment request
            db.CourseRooms.Remove(e);
            await db.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Enrollment rejected and removed."));
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize(Roles = "Admin,Staff")]
public class DashboardController(IDashboardService svc) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
        => Ok(ApiResponse<DashboardStats>.Ok(await svc.GetStatsAsync()));
}

// ═══════════════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/[controller]"), Authorize]
public class SkillsController(GymDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.TrainerSkills.OrderBy(s => s.SkillName)
            .Select(s => new SkillDto(s.SkillId, s.SkillName)).ToListAsync();
        return Ok(ApiResponse<List<SkillDto>>.Ok(list));
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateSkillRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await db.TrainerSkills.AnyAsync(s => s.SkillName == req.SkillName))
            return Conflict(ApiResponse<string>.Fail("Skill already exists."));
        var skill = new TrainerSkill { SkillName = req.SkillName };
        db.TrainerSkills.Add(skill); await db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { skill.SkillId }, "Skill created."));
    }
}



// ═══════════════════════════════════════════════════════════════
// MEMBERSHIP PLANS — Admin manages plan definitions shown on home.html
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/membership-plans"), Authorize]
public class MembershipPlansController(GymDbContext db) : ControllerBase
{
    // GET /api/membership-plans — any authenticated user (for portal)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var plans = await db.MembershipPlans.OrderBy(p => p.Price)
            .Select(p => new MembershipPlanDto(p.PlanId, p.Type, p.Description,
                p.Price, p.DurationMonths, p.IsActive))
            .ToListAsync();
        return Ok(ApiResponse<List<MembershipPlanDto>>.Ok(plans));
    }

    // POST /api/membership-plans — Admin only, create a new plan definition
    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateMembershipPlanRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await db.MembershipPlans.AnyAsync(p => p.Type == req.Type && p.IsActive))
            return Conflict(ApiResponse<string>.Fail("An active plan with this type already exists."));
        var plan = new MembershipPlan
        {
            Type = req.Type,
            Description = req.Description,
            Price = req.Price,
            DurationMonths = req.DurationMonths,
        };
        db.MembershipPlans.Add(plan);
        await db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { plan.PlanId }, "Plan created."));
    }

    // PUT /api/membership-plans/{id} — Admin only, update a plan
    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMembershipPlanRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var plan = await db.MembershipPlans.AsTracking().FirstOrDefaultAsync(p => p.PlanId == id);
        if (plan == null) return NotFound(ApiResponse<string>.Fail("Plan not found."));
        plan.Type = req.Type;
        plan.Description = req.Description;
        plan.Price = req.Price;
        plan.DurationMonths = req.DurationMonths;
        plan.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Plan updated."));
    }

    // DELETE /api/membership-plans/{id} — Admin only, deactivate
    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await db.MembershipPlans.AsTracking().FirstOrDefaultAsync(p => p.PlanId == id);
        if (plan == null) return NotFound(ApiResponse<string>.Fail("Plan not found."));
        plan.IsActive = false;
        await db.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Plan deactivated."));
    }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC CONTROLLER — No auth required
// Used by home.html (public landing page) and portal.html
// ═══════════════════════════════════════════════════════════════
[ApiController, Route("api/public")]
public class PublicController(GymDbContext db) : ControllerBase
{
    // GET /api/public/trainers — active trainers with skills
    [HttpGet("trainers"), AllowAnonymous]
    public async Task<IActionResult> GetTrainers()
    {
        var list = await db.Trainers
            .Include(t => t.User)
            .Include(t => t.SkillMaps).ThenInclude(m => m.Skill)
            .Where(t => t.IsActive)
            .OrderBy(t => t.User.FullName)
            .Select(t => new TrainerDto(
                t.TrainerId, t.UserId, t.User.FullName, t.User.Email,
                t.IsActive, t.SkillMaps.Select(m => m.Skill.SkillName).ToList()))
            .ToListAsync();
        return Ok(ApiResponse<List<TrainerDto>>.Ok(list));
    }

    // GET /api/public/courses — active courses with enrollment count
    [HttpGet("courses"), AllowAnonymous]
    public async Task<IActionResult> GetCourses()
    {
        var list = await db.Courses
            .Include(c => c.Trainer).ThenInclude(t => t.User)
            .Include(c => c.Skill)
            .Include(c => c.Enrollments)
            .Where(c => c.IsActive)
            .OrderBy(c => c.CourseName)
            .Select(c => new CourseDto(
                c.CourseId, c.CourseName, c.Trainer.User.FullName,
                c.Skill.SkillName, c.Price, c.Description,
                c.IsActive, c.Enrollments.Count))
            .ToListAsync();
        return Ok(ApiResponse<List<CourseDto>>.Ok(list));
    }

    // GET /api/public/plans — reads from tbl_membership_plans (admin-managed plan definitions)
    [HttpGet("plans"), AllowAnonymous]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await db.MembershipPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.Price)
            .Select(p => new MembershipPlanDto(p.PlanId, p.Type, p.Description,
                p.Price, p.DurationMonths, p.IsActive))
            .ToListAsync();

        if (!plans.Any())
        {
            return Ok(ApiResponse<object>.Ok(new[]
            {
                new { type = "Monthly",   price = 29.99m, durationMonths = 1 },
                new { type = "Quarterly", price = 79.99m, durationMonths = 3 },
                new { type = "Annual",    price = 249.00m, durationMonths = 12 },
            }));
        }
        return Ok(ApiResponse<object>.Ok(plans));
    }

    // POST /api/public/register — self-registration (no auth required)
    // Creates a Client account directly from the public landing page
    [HttpPost("register"), AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] CreateClientRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == req.Username))
            return Conflict(ApiResponse<string>.Fail("Username already taken."));
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == req.Email))
            return Conflict(ApiResponse<string>.Fail("Email already registered."));

        var user = new User
        {
            FullName = req.FullName,
            Username = req.Username,
            Gender = req.Gender,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 11),
            RoleId = 4 // Client
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var client = new ClientDetail
        {
            UserId = user.UserId,
            Dob = req.Dob,
            Phone = req.Phone,
            EmergencyContact = req.EmergencyContact
        };
        db.ClientDetails.Add(client);
        await db.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { client.ClientId, user.UserId }, "Account created."));
    }
}