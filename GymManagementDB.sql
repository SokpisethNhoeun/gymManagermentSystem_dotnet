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
    skill_id   INT NOT NULL REFERENCES tbl_trainer_skill(skill_id)  ON DELETE RESTRICT,
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
    UNIQUE (course_id, client_id)
);
GO

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles: 1=Admin, 2=Staff, 3=Trainer, 4=Client
INSERT INTO tbl_roles (role_name) VALUES ('Admin'),('Staff'),('Trainer'),('Client');

-- Admin user  (password: Admin@123)
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active)
VALUES (
    'Admin User', 'admin', 'M', 'admin@gympro.kh',
    '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS',
    1, 1
);

-- Staff user  (password: Admin@123)
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active)
VALUES (
    'Srey Neang', 'srey.neang', 'F', 'srey@gympro.kh',
    '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS',
    2, 1
);
INSERT INTO tbl_staff_detail (user_id, phone, place_of_birth, salary) VALUES (2, '+855 12 000 001', 'Phnom Penh', 450.00);

-- Trainer users
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active)
VALUES ('Kosal Pich',    'kosal.pich',    'M', 'kosal@gympro.kh',    '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 3, 1),
       ('Malis Chan',    'malis.chan',     'F', 'malis@gympro.kh',    '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 3, 1),
       ('Bunna Sok',     'bunna.sok',      'M', 'bunna@gympro.kh',    '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 3, 1),
       ('Leakhena Keo',  'leakhena.keo',   'F', 'leakhena@gympro.kh', '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 3, 1);

INSERT INTO tbl_trainer (user_id, is_active) VALUES (3,1),(4,1),(5,1),(6,1);

-- Skills
INSERT INTO tbl_trainer_skill (skill_name) VALUES ('HIIT'),('Yoga'),('Muay Thai'),('Spinning'),('Strength Training'),('Zumba');

-- Trainer → Skill maps
INSERT INTO tbl_trainer_skill_map (trainer_id, skill_id) VALUES (1,1),(1,5),(2,2),(2,6),(3,3),(4,4),(4,1);

-- Client users (10 sample members)
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id, is_active) VALUES
('Sophea Kem',    'sophea.kem',    'F', 'sophea@email.com',   '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Dara Chan',     'dara.chan',     'M', 'dara@email.com',     '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Raksmey Sok',   'raksmey.sok',   'F', 'raksmey@email.com',  '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Pisey Lim',     'pisey.lim',     'F', 'pisey@email.com',    '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Vichet Ros',    'vichet.ros',    'M', 'vichet@email.com',   '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Chanthy Pen',   'chanthy.pen',   'F', 'chanthy@email.com',  '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Rithy Heng',    'rithy.heng',    'M', 'rithy@email.com',    '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Dany Phon',     'dany.phon',     'M', 'dany@email.com',     '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Sreymom Tep',   'sreymom.tep',   'F', 'sreymom@email.com',  '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1),
('Makara Yem',    'makara.yem',    'M', 'makara@email.com',   '$2a$11$K5L6eX9zQvHmNpR3wTyUOuYkJdF8nCbGsVxZ7qWiMlA4P1oEhH2eS', 4, 1);

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

-- ============================================================
-- Re-hash all passwords correctly (BCrypt workFactor 11)
-- The hash above is a placeholder — run the API once then
-- call GET /api/setup/seed-passwords to set real BCrypt hashes,
-- then DELETE the SetupController from Controllers.cs
-- OR run this after the app sets real hashes via EF.
-- ============================================================
PRINT 'GymManagementDB created successfully.';
PRINT 'Default login: admin / Admin@123';
PRINT 'After first run, visit http://localhost:5000/api/setup/seed-passwords to set BCrypt hashes.';
PRINT 'Then delete SetupController from Controllers.cs before going to production.';
GO
