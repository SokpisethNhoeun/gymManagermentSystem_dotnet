create database GymManagementDB
-- ============================================================
-- GymManagementDB — Full Schema + Seed Data (FIXED)
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

-- Roles
CREATE TABLE tbl_roles (
    role_id   INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL
);

-- Users
CREATE TABLE tbl_users (
    user_id       INT IDENTITY(1,1) PRIMARY KEY,
    full_name     NVARCHAR(100) NOT NULL,
    username      NVARCHAR(100) NOT NULL UNIQUE,
    gender        NVARCHAR(1)   NULL,
    email         NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id       INT           NOT NULL,
    is_active     BIT           NOT NULL DEFAULT 1,
    create_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (role_id) REFERENCES tbl_roles(role_id)
);

-- Staff
CREATE TABLE tbl_staff_detail (
    staff_id      INT IDENTITY(1,1) PRIMARY KEY,
    user_id       INT NOT NULL,
    dob           DATETIME2 NULL,
    place_of_birth NVARCHAR(100) NULL,
    phone         NVARCHAR(50) NULL,
    salary        DECIMAL(18,2) NOT NULL DEFAULT 0,
    is_active     BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES tbl_users(user_id) ON DELETE CASCADE
);

-- Client
CREATE TABLE tbl_client_detail (
    client_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id   INT NOT NULL,
    dob       DATETIME2 NULL,
    phone     NVARCHAR(50) NULL,
    emergency_contact NVARCHAR(255) NULL,
    FOREIGN KEY (user_id) REFERENCES tbl_users(user_id) ON DELETE CASCADE
);

-- Membership
CREATE TABLE tbl_client_memberships (
    membership_id INT IDENTITY(1,1) PRIMARY KEY,
    client_id     INT NOT NULL,
    type          NVARCHAR(55) NOT NULL,
    price         DECIMAL(18,2) NOT NULL DEFAULT 0,
    start_at      DATETIME2 NOT NULL,
    expire_at     DATETIME2 NOT NULL,
    is_active     BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (client_id) REFERENCES tbl_client_detail(client_id)
);

-- Tracking
CREATE TABLE tbl_daily_customer_tracking (
    tracking_id INT IDENTITY(1,1) PRIMARY KEY,
    client_id   INT NOT NULL,
    checkin_date DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    amount      DECIMAL(18,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES tbl_client_detail(client_id)
);

-- Trainer
CREATE TABLE tbl_trainer (
    trainer_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT NOT NULL,
    is_active  BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES tbl_users(user_id) ON DELETE CASCADE
);

-- Skills
CREATE TABLE tbl_trainer_skill (
    skill_id   INT IDENTITY(1,1) PRIMARY KEY,
    skill_name NVARCHAR(50) NOT NULL UNIQUE
);

-- FIXED TABLE (IMPORTANT)
CREATE TABLE tbl_trainer_skill_map (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    trainer_id INT NOT NULL,
    skill_id   INT NOT NULL,
    FOREIGN KEY (trainer_id) REFERENCES tbl_trainer(trainer_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES tbl_trainer_skill(skill_id) ON DELETE CASCADE,
    UNIQUE (trainer_id, skill_id)
);

-- Courses
CREATE TABLE tbl_courses (
    course_id   INT IDENTITY(1,1) PRIMARY KEY,
    course_name NVARCHAR(100) NOT NULL,
    trainer_id  INT NOT NULL,
    skill_id    INT NOT NULL,
    price       DECIMAL(18,2) NOT NULL DEFAULT 0,
    description NVARCHAR(500),
    is_active   BIT NOT NULL DEFAULT 1,
    create_at   DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (trainer_id) REFERENCES tbl_trainer(trainer_id),
    FOREIGN KEY (skill_id) REFERENCES tbl_trainer_skill(skill_id)
);
-- Enrollment
CREATE TABLE tbl_courses_room (
    enrollment_id INT IDENTITY(1,1) PRIMARY KEY,
    course_id INT NOT NULL,
    client_id INT NOT NULL,
    start_at  DATETIME2 NOT NULL,
    expire_at DATETIME2 NOT NULL,
    amount    DECIMAL(18,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES tbl_courses(course_id),
    FOREIGN KEY (client_id) REFERENCES tbl_client_detail(client_id),
    UNIQUE (course_id, client_id)
);

-- =============================
-- SEED DATA
-- =============================

INSERT INTO tbl_roles (role_name)
VALUES ('Admin'),('Staff'),('Trainer'),('Client');

-- Admin
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id)
VALUES ('Admin User','admin','M','admin@gym.com','123',1);

-- Trainer skill
INSERT INTO tbl_trainer_skill (skill_name)
VALUES ('HIIT'),('Yoga'),('Muay Thai');

-- Trainer
INSERT INTO tbl_users (full_name, username, gender, email, password_hash, role_id)
VALUES ('Trainer One','trainer1','M','trainer@gym.com','123',3);

INSERT INTO tbl_trainer (user_id) VALUES (2);

-- Map
INSERT INTO tbl_trainer_skill_map (trainer_id, skill_id)
VALUES (1,1),(1,2);

PRINT ' GymManagementDB created successfully!';
GO
