-- ============================================================
-- GymManagementDB  — Full Schema + Seed Data
-- Run this once on SQL Server before starting the API
-- ============================================================

USE master;
GO

IF DB_ID('GymManagementDB') IS NOT NULL
BEGIN
    ALTER DATABASE GymManagementDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE GymManagementDB;
END
GO

CREATE DATABASE GymManagementDB;
GO
USE GymManagementDB;
GO

-- ── Roles ──────────────────────────────────────────────────
CREATE TABLE tbl_roles (
    role_id   INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL
);

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE tbl_users (
    user_id       INT IDENTITY(1,1) PRIMARY KEY,
    full_name     NVARCHAR(100) NOT NULL,
    username      NVARCHAR(100) NOT NULL UNIQUE,
    gender        NVARCHAR(1)   NULL,
    email         NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id       INT           NOT NULL REFERENCES tbl_roles(role_id),
    is_active     BIT           NOT NULL DEFAULT 1,
    email_verified_at DATETIME2 NULL,
    create_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

-- ── Staff Detail ───────────────────────────────────────────
CREATE TABLE tbl_staff_detail (
    staff_id      INT IDENTITY(1,1) PRIMARY KEY,
    user_id       INT           NOT NULL REFERENCES tbl_users(user_id) ON DELETE CASCADE,
    dob           DATETIME2     NULL,
    place_of_birth NVARCHAR(100) NULL,
    phone         NVARCHAR(50)  NULL,
    salary        DECIMAL(18,2) NOT NULL DEFAULT 0,
    is_active     BIT           NOT NULL DEFAULT 1
);

-- ── Client Detail ──────────────────────────────────────────
CREATE TABLE tbl_client_detail (
    client_id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id           INT           NOT NULL REFERENCES tbl_users(user_id) ON DELETE CASCADE,
    dob               DATETIME2     NULL,
    phone             NVARCHAR(50)  NULL,
    emergency_contact NVARCHAR(255) NULL
);

-- ── Client Memberships ─────────────────────────────────────
CREATE TABLE tbl_client_memberships (
    membership_id INT IDENTITY(1,1) PRIMARY KEY,
    client_id     INT           NOT NULL REFERENCES tbl_client_detail(client_id),
    type          NVARCHAR(55)  NOT NULL,
    price         DECIMAL(18,2) NOT NULL DEFAULT 0,
    start_at      DATETIME2     NOT NULL,
    expire_at     DATETIME2     NOT NULL,
    is_active     BIT           NOT NULL DEFAULT 1
);

-- ── Daily Customer Tracking (Check-ins) ────────────────────
CREATE TABLE tbl_daily_customer_tracking (
    tracking_id  INT IDENTITY(1,1) PRIMARY KEY,
    client_id    INT           NOT NULL REFERENCES tbl_client_detail(client_id),
    checkin_date DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    amount       DECIMAL(18,2) NOT NULL DEFAULT 0
);

-- ── Trainer ────────────────────────────────────────────────
CREATE TABLE tbl_trainer (
    trainer_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES tbl_users(user_id) ON DELETE CASCADE,
    is_active  BIT NOT NULL DEFAULT 1
);

-- ── Trainer Skills ─────────────────────────────────────────
CREATE TABLE tbl_trainer_skill (
    skill_id   INT IDENTITY(1,1) PRIMARY KEY,
    skill_name NVARCHAR(50) NOT NULL UNIQUE
);

-- ── Trainer Skill Map ──────────────────────────────────────
CREATE TABLE tbl_trainer_skill_map (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    trainer_id INT NOT NULL REFERENCES tbl_trainer(trainer_id)      ON DELETE CASCADE,
    skill_id   INT NOT NULL REFERENCES tbl_trainer_skill(skill_id)  ON DELETE NO ACTION,
    UNIQUE (trainer_id, skill_id)
);

-- ── Courses ────────────────────────────────────────────────
CREATE TABLE tbl_courses (
    course_id   INT IDENTITY(1,1) PRIMARY KEY,
    course_name NVARCHAR(100)  NOT NULL,
    trainer_id  INT            NOT NULL REFERENCES tbl_trainer(trainer_id),
    skill_id    INT            NOT NULL REFERENCES tbl_trainer_skill(skill_id),
    price       DECIMAL(18,2)  NOT NULL DEFAULT 0,
    description NVARCHAR(500)  NULL,
    is_active   BIT            NOT NULL DEFAULT 1,
    create_at   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

-- ── Course Enrollments ─────────────────────────────────────
CREATE TABLE tbl_courses_room (
    enrollment_id INT IDENTITY(1,1) PRIMARY KEY,
    course_id     INT           NOT NULL REFERENCES tbl_courses(course_id),
    client_id     INT           NOT NULL REFERENCES tbl_client_detail(client_id),
    start_at      DATETIME2     NOT NULL,
    expire_at     DATETIME2     NOT NULL,
    amount        DECIMAL(18,2) NOT NULL DEFAULT 0,
    is_approved   BIT           NOT NULL DEFAULT 0,
    approved_by   INT           NULL,
    approved_at   DATETIME2     NULL,
    UNIQUE (course_id, client_id)
);

-- ── Membership Plan Definitions ───────────────────────────
CREATE TABLE tbl_membership_plans (
    plan_id         INT IDENTITY(1,1) PRIMARY KEY,
    type            NVARCHAR(55)  NOT NULL,
    description     NVARCHAR(500) NULL,
    price           DECIMAL(18,2) NOT NULL DEFAULT 0,
    duration_months INT           NOT NULL DEFAULT 1,
    is_active       BIT           NOT NULL DEFAULT 1,
    created_at      DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

-- ── OTP Challenges ────────────────────────────────────────
CREATE TABLE tbl_otp_challenges (
    otp_challenge_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id          INT           NOT NULL REFERENCES tbl_users(user_id) ON DELETE CASCADE,
    purpose          NVARCHAR(30)  NOT NULL,
    otp_token_hash   NVARCHAR(128) NOT NULL UNIQUE,
    code_hash        NVARCHAR(255) NOT NULL,
    email            NVARCHAR(100) NOT NULL,
    expires_at       DATETIME2     NOT NULL,
    created_at       DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    consumed_at      DATETIME2     NULL,
    attempts         INT           NOT NULL DEFAULT 0
);
CREATE INDEX IX_tbl_otp_challenges_user_purpose_expires
ON tbl_otp_challenges(user_id, purpose, expires_at);

-- ── Payments / Bakong KHQR ────────────────────────────────
CREATE TABLE tbl_payments (
    payment_id          INT IDENTITY(1,1) PRIMARY KEY,
    client_id           INT           NULL REFERENCES tbl_client_detail(client_id) ON DELETE SET NULL,
    membership_id       INT           NULL REFERENCES tbl_client_memberships(membership_id) ON DELETE SET NULL,
    enrollment_id       INT           NULL REFERENCES tbl_courses_room(enrollment_id) ON DELETE SET NULL,
    purpose             NVARCHAR(30)  NOT NULL,
    amount              DECIMAL(18,2) NOT NULL DEFAULT 0,
    currency            NVARCHAR(3)   NOT NULL DEFAULT 'USD',
    status              NVARCHAR(30)  NOT NULL DEFAULT 'Pending',
    provider            NVARCHAR(30)  NOT NULL DEFAULT 'BakongKHQR',
    reference           NVARCHAR(80)  NOT NULL UNIQUE,
    provider_reference  NVARCHAR(255) NULL,
    md5_hash            NVARCHAR(32)  NULL,
    bakong_account_id   NVARCHAR(255) NULL,
    merchant_name       NVARCHAR(100) NULL,
    merchant_city       NVARCHAR(100) NULL,
    qr_payload          NVARCHAR(2048) NULL,
    qr_image_data_uri   NVARCHAR(MAX) NULL,
    metadata_json       NVARCHAR(MAX) NULL,
    created_at          DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    expires_at          DATETIME2     NOT NULL,
    paid_at             DATETIME2     NULL
);
CREATE INDEX IX_tbl_payments_client_status_created
ON tbl_payments(client_id, status, created_at);
GO

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles: 1=Admin, 2=Staff, 3=Trainer, 4=Client
INSERT INTO tbl_roles (role_name) VALUES ('Admin'),('Staff'),('Trainer'),('Client');

-- Admin user  (password: sethadmin)
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active)
VALUES (
    'Admin User', 'admin', 'M', 'ahboy5518@gmail.com',
    '$2b$11$KFquhYGeIT50i6/L3d40Ied/zB9cy4pn4NWvpqSCbdl7ju.xtXH9y',
    1, 1
);

-- Staff user  (password: Admin@123)
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active)
VALUES (
    'Srey Neang', 'srey.neang', 'F', 'srey@gympro.kh',
    '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6',
    2, 1
);
INSERT INTO tbl_staff_detail (user_id, phone, place_of_birth, salary) VALUES (2, '+855 12 000 001', 'Phnom Penh', 450.00);

-- Trainer users
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active)
VALUES ('Kosal Pich',    'kosal.pich',    'M', 'kosal@gympro.kh',    '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 3, 1),
       ('Malis Chan',    'malis.chan',     'F', 'malis@gympro.kh',    '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 3, 1),
       ('Bunna Sok',     'bunna.sok',      'M', 'bunna@gympro.kh',    '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 3, 1),
       ('Leakhena Keo',  'leakhena.keo',   'F', 'leakhena@gympro.kh', '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 3, 1);

INSERT INTO tbl_trainer (user_id, is_active) VALUES (3,1),(4,1),(5,1),(6,1);

-- Skills
INSERT INTO tbl_trainer_skill (skill_name) VALUES ('HIIT'),('Yoga'),('Muay Thai'),('Spinning'),('Strength Training'),('Zumba');

-- Trainer → Skill maps
INSERT INTO tbl_trainer_skill_map (trainer_id, skill_id) VALUES (1,1),(1,5),(2,2),(2,6),(3,3),(4,4),(4,1);

-- Client users (10 sample members)
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active) VALUES
('Sophea Kem',    'sophea.kem',    'F', 'sophea@email.com',   '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Dara Chan',     'dara.chan',     'M', 'dara@email.com',     '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Raksmey Sok',   'raksmey.sok',   'F', 'raksmey@email.com',  '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Pisey Lim',     'pisey.lim',     'F', 'pisey@email.com',    '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Vichet Ros',    'vichet.ros',    'M', 'vichet@email.com',   '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Chanthy Pen',   'chanthy.pen',   'F', 'chanthy@email.com',  '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Rithy Heng',    'rithy.heng',    'M', 'rithy@email.com',    '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Dany Phon',     'dany.phon',     'M', 'dany@email.com',     '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Sreymom Tep',   'sreymom.tep',   'F', 'sreymom@email.com',  '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1),
('Makara Yem',    'makara.yem',    'M', 'makara@email.com',   '$2b$11$CQi/QdqzlF7QO6mjmYz6Aeu4dw7XqRkovUqFI5NaK/H1Mrodt/xy6', 4, 1);

INSERT INTO tbl_client_detail (user_id, dob, phone, emergency_contact) VALUES
(7,  '1995-04-12', '+855 12 111 001', 'Kem Sokha · +855 12 111 002'),
(8,  '1992-07-23', '+855 12 111 003', 'Chan Dary · +855 12 111 004'),
(9,  '1998-11-05', '+855 12 111 005', 'Sok Ratha · +855 12 111 006'),
(10, '1990-02-18', '+855 12 111 007', 'Lim Sothy · +855 12 111 008'),
(11, '1997-09-30', '+855 12 111 009', 'Ros Chan · +855 12 111 010'),
(12, '1993-06-14', '+855 12 111 011', 'Pen Vuth · +855 12 111 012'),
(13, '1996-03-27', '+855 12 111 013', 'Heng Sila · +855 12 111 014'),
(14, '1994-12-08', '+855 12 111 015', 'Phon Rith · +855 12 111 016'),
(15, '1999-08-21', '+855 12 111 017', 'Tep Nary · +855 12 111 018'),
(16, '1991-05-03', '+855 12 111 019', 'Yem Bora · +855 12 111 020');

-- Memberships (mix of types & dates for realistic charts)
DECLARE @today DATETIME2 = GETUTCDATE();
INSERT INTO tbl_membership_plans (type, description, price, duration_months, is_active) VALUES
('Monthly',   'Flexible month-to-month access.', 29.99, 1, 1),
('Quarterly', 'Three months with better value.', 79.99, 3, 1),
('Annual',    'Full-year membership package.', 249.00, 12, 1);

INSERT INTO tbl_client_memberships (client_id, type, price, start_at, expire_at, is_active) VALUES
(1, 'Annual',    249.00, DATEADD(month,-2,@today), DATEADD(month,10,@today), 1),
(2, 'Monthly',    29.99, DATEADD(month,-1,@today), DATEADD(month, 0,@today), 1),
(3, 'Quarterly',  79.99, DATEADD(month,-3,@today), DATEADD(month, 0,@today), 0),
(4, 'Monthly',    29.99, @today,                   DATEADD(month, 1,@today), 1),
(5, 'Annual',    249.00, DATEADD(month,-5,@today), DATEADD(month, 7,@today), 1),
(6, 'Quarterly',  79.99, DATEADD(month,-1,@today), DATEADD(month, 2,@today), 1),
(7, 'Monthly',    29.99, DATEADD(month,-4,@today), DATEADD(month,-3,@today), 0),
(8, 'Annual',    249.00, DATEADD(month,-1,@today), DATEADD(month,11,@today), 1),
(9, 'Monthly',    29.99, DATEADD(month,-2,@today), DATEADD(month,-1,@today), 0),
(10,'Quarterly',  79.99, DATEADD(month,-3,@today), DATEADD(month, 0,@today), 1);

-- Check-ins today + last 7 days
INSERT INTO tbl_daily_customer_tracking (client_id, checkin_date, amount) VALUES
(1, DATEADD(hour,-1,@today),  0),
(2, DATEADD(hour,-2,@today),  0),
(3, DATEADD(hour,-3,@today),  5.00),
(4, DATEADD(hour,-4,@today),  0),
(5, DATEADD(hour,-5,@today),  0),
(1, DATEADD(day,-1,@today),   0),
(3, DATEADD(day,-1,@today),   5.00),
(6, DATEADD(day,-2,@today),   0),
(7, DATEADD(day,-2,@today),   0),
(2, DATEADD(day,-3,@today),   0),
(8, DATEADD(day,-4,@today),   0),
(9, DATEADD(day,-5,@today),   5.00),
(10,DATEADD(day,-6,@today),   0);

-- Courses
INSERT INTO tbl_courses (course_name, trainer_id, skill_id, price, description) VALUES
('HIIT Morning Blast',  1, 1, 45.00, 'High-intensity interval training, 45 min, all levels welcome.'),
('Hatha Yoga Flow',     2, 2, 35.00, 'Gentle morning yoga to build flexibility and mindfulness.'),
('Muay Thai Basics',    3, 3, 50.00, 'Beginner-friendly Muay Thai fundamentals.'),
('Spinning Power',      4, 4, 40.00, 'High-energy indoor cycling class.'),
('Strength & Tone',     1, 5, 55.00, 'Progressive weight training for muscle building.');

-- Enrollments
INSERT INTO tbl_courses_room (course_id, client_id, start_at, expire_at, amount) VALUES
(1, 1, DATEADD(month,-1,@today), DATEADD(month,2,@today),  45.00),
(1, 2, DATEADD(month,-1,@today), DATEADD(month,2,@today),  45.00),
(2, 3, DATEADD(month,-2,@today), DATEADD(month,1,@today),  35.00),
(2, 4, DATEADD(month,-1,@today), DATEADD(month,2,@today),  35.00),
(3, 5, DATEADD(month,-3,@today), DATEADD(month,0,@today),  50.00),
(4, 6, DATEADD(month,-1,@today), DATEADD(month,2,@today),  40.00),
(5, 7, DATEADD(month,-2,@today), DATEADD(month,1,@today),  55.00),
(1, 8, DATEADD(month,-1,@today), DATEADD(month,2,@today),  45.00),
(3, 9, DATEADD(month,-1,@today), DATEADD(month,2,@today),  50.00),
(2,10, DATEADD(month,-1,@today), DATEADD(month,2,@today),  35.00);
GO

PRINT 'GymManagementDB created successfully.';
PRINT 'Default login: ahboy5518@gmail.com / sethadmin';
PRINT 'OTP is required after password login; local development writes OTP codes to API logs when Email:Enabled=false.';
GO
