:setvar DbName "GymManagementDB"
USE [$(DbName)]
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF EXISTS (
    SELECT 1
    FROM (VALUES
        (1, N'Admin'),
        (2, N'Staff'),
        (3, N'Trainer'),
        (4, N'Client')
    ) AS seed(role_id, role_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.tbl_roles r WHERE r.role_id = seed.role_id
    )
)
BEGIN
    SET IDENTITY_INSERT dbo.tbl_roles ON;

    INSERT INTO dbo.tbl_roles (role_id, role_name)
    SELECT seed.role_id, seed.role_name
    FROM (VALUES
        (1, N'Admin'),
        (2, N'Staff'),
        (3, N'Trainer'),
        (4, N'Client')
    ) AS seed(role_id, role_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.tbl_roles r WHERE r.role_id = seed.role_id
    );

    SET IDENTITY_INSERT dbo.tbl_roles OFF;
END;

IF EXISTS (
    SELECT 1
    FROM (VALUES
        (1, N'admin', N'ahboy5518@gmail.com'),
        (2, N'staff', N'staff@gym.local'),
        (3, N'trainer1', N'trainer1@gym.local'),
        (4, N'member1', N'member1@gym.local')
    ) AS seed(user_id, username, email)
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.tbl_users u WHERE u.user_id = seed.user_id
    )
)
BEGIN
    SET IDENTITY_INSERT dbo.tbl_users ON;

    INSERT INTO dbo.tbl_users
        (user_id, full_name, username, gender, email, password_hash, role_id, is_active, email_verified_at, create_at)
    SELECT
        seed.user_id,
        seed.full_name,
        seed.username,
        seed.gender,
        seed.email,
        seed.password_hash,
        seed.role_id,
        seed.is_active,
        seed.email_verified_at,
        seed.create_at
    FROM (VALUES
        (1, N'Admin User', N'admin', N'M', N'ahboy5518@gmail.com', N'$2b$11$KFquhYGeIT50i6/L3d40Ied/zB9cy4pn4NWvpqSCbdl7ju.xtXH9y', 1, CONVERT(bit, 1), CONVERT(datetime2, NULL), CONVERT(datetime2, '2024-01-01T00:00:00')),
        (2, N'Staff User', N'staff', N'F', N'staff@gym.local', N'$2b$11$pBkB0zE7LrzgDMIcdE.1tefMTA2dZP07va9It4ks6/Z/B4EBCpPoW', 2, CONVERT(bit, 1), CONVERT(datetime2, NULL), CONVERT(datetime2, '2024-01-01T00:00:00')),
        (3, N'Trainer One', N'trainer1', N'M', N'trainer1@gym.local', N'$2b$11$FpzWqYLD3MPBZh7Q.10o.eT1Rs7Ab6pO9htPYMKw9vuroSVuhbs12', 3, CONVERT(bit, 1), CONVERT(datetime2, NULL), CONVERT(datetime2, '2024-01-01T00:00:00')),
        (4, N'Member One', N'member1', N'F', N'member1@gym.local', N'$2b$11$N7m/1uzIQ/N4efanH77bxOx8NaV0ukfpOlZt3DrZmIfM66tuaW/Ui', 4, CONVERT(bit, 1), CONVERT(datetime2, NULL), CONVERT(datetime2, '2024-01-01T00:00:00'))
    ) AS seed(user_id, full_name, username, gender, email, password_hash, role_id, is_active, email_verified_at, create_at)
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.tbl_users u WHERE u.user_id = seed.user_id
    );

    SET IDENTITY_INSERT dbo.tbl_users OFF;
END;

COMMIT TRANSACTION;
GO
