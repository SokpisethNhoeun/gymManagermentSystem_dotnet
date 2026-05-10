using GymApi.Models;
using Microsoft.EntityFrameworkCore;

namespace GymApi.Data;

public class GymDbContext(DbContextOptions<GymDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<StaffDetail> StaffDetails { get; set; }
    public DbSet<ClientDetail> ClientDetails { get; set; }
    public DbSet<ClientMembership> ClientMemberships { get; set; }
    public DbSet<DailyCustomerTracking> DailyCustomerTrackings { get; set; }
    public DbSet<Trainer> Trainers { get; set; }
    public DbSet<TrainerSkill> TrainerSkills { get; set; }
    public DbSet<TrainerSkillMap> TrainerSkillMaps { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseRoom> CourseRooms { get; set; }
    public DbSet<MembershipPlan> MembershipPlans { get; set; }
    public DbSet<OtpChallenge> OtpChallenges { get; set; }
    public DbSet<Payment> Payments { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        mb.Entity<Role>(e => {
            e.ToTable("tbl_roles");
            e.HasKey(x => x.RoleId);
            e.Property(x => x.RoleId).HasColumnName("role_id");
            e.Property(x => x.RoleName).HasColumnName("role_name").HasMaxLength(50).IsRequired();
            e.HasData(
                new GymApi.Models.Role { RoleId = 1, RoleName = "Admin" },
                new GymApi.Models.Role { RoleId = 2, RoleName = "Staff" },
                new GymApi.Models.Role { RoleId = 3, RoleName = "Trainer" },
                new GymApi.Models.Role { RoleId = 4, RoleName = "Client" }
            );
        });

        mb.Entity<User>(e => {
            e.ToTable("tbl_users");
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(100).IsRequired();
            e.Property(x => x.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
            e.Property(x => x.Gender).HasColumnName("gender").HasMaxLength(1);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            e.Property(x => x.RoleId).HasColumnName("role_id");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.EmailVerifiedAt).HasColumnName("email_verified_at");
            e.Property(x => x.CreateAt).HasColumnName("create_at");
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.HasOne(x => x.Role).WithMany(r => r.Users).HasForeignKey(x => x.RoleId);
            // Global filter: hide inactive users everywhere (use IgnoreQueryFilters() to bypass)
            e.HasQueryFilter(x => x.IsActive);
            e.HasData(
                // admin → sethadmin
                new GymApi.Models.User
                {
                    UserId = 1,
                    FullName = "Admin User",
                    Username = "admin",
                    Gender = "M",
                    Email = "ahboy5518@gmail.com",
                    PasswordHash = "$2b$11$KFquhYGeIT50i6/L3d40Ied/zB9cy4pn4NWvpqSCbdl7ju.xtXH9y",
                    RoleId = 1,
                    IsActive = true,
                    CreateAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                // staff → Staff@123
                new GymApi.Models.User
                {
                    UserId = 2,
                    FullName = "Staff User",
                    Username = "staff",
                    Gender = "F",
                    Email = "staff@gym.local",
                    PasswordHash = "$2b$11$pBkB0zE7LrzgDMIcdE.1tefMTA2dZP07va9It4ks6/Z/B4EBCpPoW",
                    RoleId = 2,
                    IsActive = true,
                    CreateAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                // trainer1 → Trainer@123
                new GymApi.Models.User
                {
                    UserId = 3,
                    FullName = "Trainer One",
                    Username = "trainer1",
                    Gender = "M",
                    Email = "trainer1@gym.local",
                    PasswordHash = "$2b$11$FpzWqYLD3MPBZh7Q.10o.eT1Rs7Ab6pO9htPYMKw9vuroSVuhbs12",
                    RoleId = 3,
                    IsActive = true,
                    CreateAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                // member1 → Client@123
                new GymApi.Models.User
                {
                    UserId = 4,
                    FullName = "Member One",
                    Username = "member1",
                    Gender = "F",
                    Email = "member1@gym.local",
                    PasswordHash = "$2b$11$N7m/1uzIQ/N4efanH77bxOx8NaV0ukfpOlZt3DrZmIfM66tuaW/Ui",
                    RoleId = 4,
                    IsActive = true,
                    CreateAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });

        mb.Entity<StaffDetail>(e => {
            e.ToTable("tbl_staff_detail");
            e.HasKey(x => x.StaffId);
            e.Property(x => x.StaffId).HasColumnName("staff_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Dob).HasColumnName("dob");
            e.Property(x => x.PlaceOfBirth).HasColumnName("place_of_birth").HasMaxLength(100);
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50);
            e.Property(x => x.Salary).HasColumnName("salary").HasColumnType("decimal(18,2)");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.HasOne(x => x.User).WithOne(u => u.StaffDetail)
                .HasForeignKey<StaffDetail>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<ClientDetail>(e => {
            e.ToTable("tbl_client_detail");
            e.HasKey(x => x.ClientId);
            e.Property(x => x.ClientId).HasColumnName("client_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Dob).HasColumnName("dob");
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50);
            e.Property(x => x.EmergencyContact).HasColumnName("emergency_contact").HasMaxLength(255);
            e.HasOne(x => x.User).WithOne(u => u.ClientDetail)
                .HasForeignKey<ClientDetail>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<ClientMembership>(e => {
            e.ToTable("tbl_client_memberships");
            e.HasKey(x => x.MembershipId);
            e.Property(x => x.MembershipId).HasColumnName("membership_id");
            e.Property(x => x.ClientId).HasColumnName("client_id");
            e.Property(x => x.Type).HasColumnName("type").HasMaxLength(55).IsRequired();
            e.Property(x => x.Price).HasColumnName("price").HasColumnType("decimal(18,2)");
            e.Property(x => x.StartAt).HasColumnName("start_at");
            e.Property(x => x.ExpireAt).HasColumnName("expire_at");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.HasOne(x => x.Client).WithMany(c => c.Memberships).HasForeignKey(x => x.ClientId);
        });

        mb.Entity<DailyCustomerTracking>(e => {
            e.ToTable("tbl_daily_customer_tracking");
            e.HasKey(x => x.TrackingId);
            e.Property(x => x.TrackingId).HasColumnName("tracking_id");
            e.Property(x => x.ClientId).HasColumnName("client_id");
            e.Property(x => x.CheckinDate).HasColumnName("checkin_date");
            e.Property(x => x.Amount).HasColumnName("amount").HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Client).WithMany(c => c.CheckIns).HasForeignKey(x => x.ClientId);
        });

        mb.Entity<Trainer>(e => {
            e.ToTable("tbl_trainer");
            e.HasKey(x => x.TrainerId);
            e.Property(x => x.TrainerId).HasColumnName("trainer_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.HasOne(x => x.User).WithOne(u => u.Trainer)
                .HasForeignKey<Trainer>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<TrainerSkill>(e => {
            e.ToTable("tbl_trainer_skill");
            e.HasKey(x => x.SkillId);
            e.Property(x => x.SkillId).HasColumnName("skill_id");
            e.Property(x => x.SkillName).HasColumnName("skill_name").HasMaxLength(50).IsRequired();
        });

        mb.Entity<TrainerSkillMap>(e => {
            e.ToTable("tbl_trainer_skill_map");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.TrainerId).HasColumnName("trainer_id");
            e.Property(x => x.SkillId).HasColumnName("skill_id");
            e.HasIndex(x => new { x.TrainerId, x.SkillId }).IsUnique();
            e.HasOne(x => x.Trainer).WithMany(t => t.SkillMaps)
                .HasForeignKey(x => x.TrainerId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Skill).WithMany(s => s.TrainerMaps)
                .HasForeignKey(x => x.SkillId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<Course>(e => {
            e.ToTable("tbl_courses");
            e.HasKey(x => x.CourseId);
            e.Property(x => x.CourseId).HasColumnName("course_id");
            e.Property(x => x.CourseName).HasColumnName("course_name").HasMaxLength(100).IsRequired();
            e.Property(x => x.TrainerId).HasColumnName("trainer_id");
            e.Property(x => x.SkillId).HasColumnName("skill_id");
            e.Property(x => x.Price).HasColumnName("price").HasColumnType("decimal(18,2)");
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreateAt).HasColumnName("create_at");
            e.HasOne(x => x.Trainer).WithMany(t => t.Courses).HasForeignKey(x => x.TrainerId);
            e.HasOne(x => x.Skill).WithMany(s => s.Courses).HasForeignKey(x => x.SkillId);
        });

        mb.Entity<CourseRoom>(e => {
            e.ToTable("tbl_courses_room");
            e.HasKey(x => x.EnrollmentId);
            e.Property(x => x.EnrollmentId).HasColumnName("enrollment_id");
            e.Property(x => x.CourseId).HasColumnName("course_id");
            e.Property(x => x.ClientId).HasColumnName("client_id");
            e.Property(x => x.StartAt).HasColumnName("start_at");
            e.Property(x => x.ExpireAt).HasColumnName("expire_at");
            e.Property(x => x.Amount).HasColumnName("amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.IsApproved).HasColumnName("is_approved").HasDefaultValue(false);
            e.Property(x => x.ApprovedBy).HasColumnName("approved_by");
            e.Property(x => x.ApprovedAt).HasColumnName("approved_at");
            e.HasIndex(x => new { x.CourseId, x.ClientId }).IsUnique();
            e.HasOne(x => x.Course).WithMany(c => c.Enrollments).HasForeignKey(x => x.CourseId);
            e.HasOne(x => x.Client).WithMany(c => c.Enrollments).HasForeignKey(x => x.ClientId);
        });

        mb.Entity<MembershipPlan>(e => {
            e.ToTable("tbl_membership_plans");
            e.HasKey(x => x.PlanId);
            e.Property(x => x.PlanId).HasColumnName("plan_id");
            e.Property(x => x.Type).HasColumnName("type").IsRequired();
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.Price).HasColumnName("price").HasColumnType("decimal(18,2)");
            e.Property(x => x.DurationMonths).HasColumnName("duration_months");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        mb.Entity<OtpChallenge>(e => {
            e.ToTable("tbl_otp_challenges");
            e.HasKey(x => x.OtpChallengeId);
            e.Property(x => x.OtpChallengeId).HasColumnName("otp_challenge_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Purpose).HasColumnName("purpose").HasMaxLength(30).IsRequired();
            e.Property(x => x.OtpTokenHash).HasColumnName("otp_token_hash").HasMaxLength(128).IsRequired();
            e.Property(x => x.CodeHash).HasColumnName("code_hash").HasMaxLength(255).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.ConsumedAt).HasColumnName("consumed_at");
            e.Property(x => x.Attempts).HasColumnName("attempts");
            e.HasIndex(x => x.OtpTokenHash).IsUnique();
            e.HasIndex(x => new { x.UserId, x.Purpose, x.ExpiresAt });
            e.HasOne(x => x.User).WithMany(u => u.OtpChallenges)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<Payment>(e => {
            e.ToTable("tbl_payments");
            e.HasKey(x => x.PaymentId);
            e.Property(x => x.PaymentId).HasColumnName("payment_id");
            e.Property(x => x.ClientId).HasColumnName("client_id");
            e.Property(x => x.MembershipId).HasColumnName("membership_id");
            e.Property(x => x.EnrollmentId).HasColumnName("enrollment_id");
            e.Property(x => x.Purpose).HasColumnName("purpose").HasMaxLength(30).IsRequired();
            e.Property(x => x.Amount).HasColumnName("amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3).IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
            e.Property(x => x.Provider).HasColumnName("provider").HasMaxLength(30).IsRequired();
            e.Property(x => x.Reference).HasColumnName("reference").HasMaxLength(80).IsRequired();
            e.Property(x => x.ProviderReference).HasColumnName("provider_reference").HasMaxLength(255);
            e.Property(x => x.Md5Hash).HasColumnName("md5_hash").HasMaxLength(32);
            e.Property(x => x.BakongAccountId).HasColumnName("bakong_account_id").HasMaxLength(255);
            e.Property(x => x.MerchantName).HasColumnName("merchant_name").HasMaxLength(100);
            e.Property(x => x.MerchantCity).HasColumnName("merchant_city").HasMaxLength(100);
            e.Property(x => x.QrPayload).HasColumnName("qr_payload").HasMaxLength(2048);
            e.Property(x => x.QrImageDataUri).HasColumnName("qr_image_data_uri");
            e.Property(x => x.MetadataJson).HasColumnName("metadata_json");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.Property(x => x.PaidAt).HasColumnName("paid_at");
            e.HasIndex(x => x.Reference).IsUnique();
            e.HasIndex(x => new { x.ClientId, x.Status, x.CreatedAt });
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Membership).WithMany().HasForeignKey(x => x.MembershipId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Enrollment).WithMany().HasForeignKey(x => x.EnrollmentId).OnDelete(DeleteBehavior.SetNull);
        });
    }

    public override int SaveChanges()
    {
        SetTimestamps(); return base.SaveChanges();
    }
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        SetTimestamps(); return base.SaveChangesAsync(ct);
    }
    private void SetTimestamps()
    {
        foreach (var e in ChangeTracker.Entries<User>().Where(e => e.State == EntityState.Added))
            e.Entity.CreateAt = DateTime.UtcNow;

    }
}
