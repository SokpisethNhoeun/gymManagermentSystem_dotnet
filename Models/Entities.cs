using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymApi.Models;

public class Role
{
    [Key] public int RoleId { get; set; }
    [Required, MaxLength(50)] public string RoleName { get; set; } = "";
    public ICollection<User> Users { get; set; } = [];
}

public class User
{
    [Key] public int UserId { get; set; }
    [Required, MaxLength(100)] public string FullName { get; set; } = "";
    [Required, MaxLength(100)] public string Username { get; set; } = "";
    [MaxLength(1)] public string? Gender { get; set; }
    [Required, MaxLength(100)] public string Email { get; set; } = "";
    [Required, MaxLength(255)] public string PasswordHash { get; set; } = "";
    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreateAt { get; set; } = DateTime.UtcNow;
    [ForeignKey(nameof(RoleId))] public Role Role { get; set; } = null!;
    public StaffDetail? StaffDetail { get; set; }
    public ClientDetail? ClientDetail { get; set; }
    public Trainer? Trainer { get; set; }
}

public class StaffDetail
{
    [Key] public int StaffId { get; set; }
    public int UserId { get; set; }
    public DateTime? Dob { get; set; }
    [MaxLength(100)] public string? PlaceOfBirth { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Salary { get; set; }
    public bool IsActive { get; set; } = true;
    [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
}

public class ClientDetail
{
    [Key] public int ClientId { get; set; }
    public int UserId { get; set; }
    public DateTime? Dob { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(255)] public string? EmergencyContact { get; set; }
    [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
    public ICollection<ClientMembership> Memberships { get; set; } = [];
    public ICollection<DailyCustomerTracking> CheckIns { get; set; } = [];
    public ICollection<CourseRoom> Enrollments { get; set; } = [];
}

public class ClientMembership
{
    [Key] public int MembershipId { get; set; }
    public int ClientId { get; set; }
    [Required, MaxLength(55)] public string Type { get; set; } = "";
    [Column(TypeName = "decimal(18,2)")] public decimal Price { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime ExpireAt { get; set; }
    public bool IsActive { get; set; } = true;
    [ForeignKey(nameof(ClientId))] public ClientDetail Client { get; set; } = null!;
}

public class DailyCustomerTracking
{
    [Key] public int TrackingId { get; set; }
    public int ClientId { get; set; }
    public DateTime CheckinDate { get; set; } = DateTime.UtcNow;
    [Column(TypeName = "decimal(18,2)")] public decimal Amount { get; set; }
    [ForeignKey(nameof(ClientId))] public ClientDetail Client { get; set; } = null!;
}

public class Trainer
{
    [Key] public int TrainerId { get; set; }
    public int UserId { get; set; }
    public bool IsActive { get; set; } = true;
    [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
    public ICollection<TrainerSkillMap> SkillMaps { get; set; } = [];
    public ICollection<Course> Courses { get; set; } = [];
}

public class TrainerSkill
{
    [Key] public int SkillId { get; set; }
    [Required, MaxLength(50)] public string SkillName { get; set; } = "";
    public ICollection<TrainerSkillMap> TrainerMaps { get; set; } = [];
    public ICollection<Course> Courses { get; set; } = [];
}

public class TrainerSkillMap
{
    [Key] public int Id { get; set; }
    public int TrainerId { get; set; }
    public int SkillId { get; set; }
    [ForeignKey(nameof(TrainerId))] public Trainer Trainer { get; set; } = null!;
    [ForeignKey(nameof(SkillId))] public TrainerSkill Skill { get; set; } = null!;
}

public class Course
{
    [Key] public int CourseId { get; set; }
    [Required, MaxLength(100)] public string CourseName { get; set; } = "";
    public int TrainerId { get; set; }
    public int SkillId { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price { get; set; }
    [MaxLength(500)] public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreateAt { get; set; } = DateTime.UtcNow;
    [ForeignKey(nameof(TrainerId))] public Trainer Trainer { get; set; } = null!;
    [ForeignKey(nameof(SkillId))] public TrainerSkill Skill { get; set; } = null!;
    public ICollection<CourseRoom> Enrollments { get; set; } = [];
}

public class CourseRoom
{
    [Key] public int EnrollmentId { get; set; }
    public int CourseId { get; set; }
    public int ClientId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime ExpireAt { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Amount { get; set; }
    public bool IsApproved { get; set; } = false;
    public int? ApprovedBy { get; set; }  // UserId of staff who approved
    public DateTime? ApprovedAt { get; set; }
    [ForeignKey(nameof(CourseId))] public Course Course { get; set; } = null!;
    [ForeignKey(nameof(ClientId))] public ClientDetail Client { get; set; } = null!;
}

public class MembershipPlan
{
    [Key] public int PlanId { get; set; }
    [MaxLength(55)] public string Type { get; set; } = null!;
    [MaxLength(500)] public string? Description { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price { get; set; }
    public int DurationMonths { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}