USE [GymManagementDB]
GO
/****** Object:  Table [dbo].[tbl_client_detail]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_client_detail](
	[client_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[dob] [datetime2](7) NULL,
	[phone] [nvarchar](50) NULL,
	[emergency_contact] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[client_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_client_memberships]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_client_memberships](
	[membership_id] [int] IDENTITY(1,1) NOT NULL,
	[client_id] [int] NOT NULL,
	[type] [nvarchar](55) NOT NULL,
	[price] [decimal](18, 2) NOT NULL,
	[start_at] [datetime2](7) NOT NULL,
	[expire_at] [datetime2](7) NOT NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[membership_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_courses]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_courses](
	[course_id] [int] IDENTITY(1,1) NOT NULL,
	[course_name] [nvarchar](100) NOT NULL,
	[trainer_id] [int] NOT NULL,
	[skill_id] [int] NOT NULL,
	[price] [decimal](18, 2) NOT NULL,
	[description] [nvarchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[create_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[course_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_courses_room]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_courses_room](
	[enrollment_id] [int] IDENTITY(1,1) NOT NULL,
	[course_id] [int] NOT NULL,
	[client_id] [int] NOT NULL,
	[start_at] [datetime2](7) NOT NULL,
	[expire_at] [datetime2](7) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[is_approved] [bit] NOT NULL,
	[approved_by] [int] NULL,
	[approved_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[enrollment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[course_id] ASC,
	[client_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_daily_customer_tracking]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_daily_customer_tracking](
	[tracking_id] [int] IDENTITY(1,1) NOT NULL,
	[client_id] [int] NOT NULL,
	[checkin_date] [datetime2](7) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[tracking_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_membership_plans]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_membership_plans](
	[plan_id] [int] IDENTITY(1,1) NOT NULL,
	[type] [nvarchar](55) NOT NULL,
	[description] [nvarchar](500) NULL,
	[price] [decimal](18, 2) NOT NULL,
	[duration_months] [int] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[plan_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_otp_challenges]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_otp_challenges](
	[otp_challenge_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[purpose] [nvarchar](30) NOT NULL,
	[otp_token_hash] [nvarchar](128) NOT NULL,
	[code_hash] [nvarchar](255) NOT NULL,
	[email] [nvarchar](100) NOT NULL,
	[expires_at] [datetime2](7) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[consumed_at] [datetime2](7) NULL,
	[attempts] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[otp_challenge_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[otp_token_hash] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_payments]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_payments](
	[payment_id] [int] IDENTITY(1,1) NOT NULL,
	[client_id] [int] NULL,
	[membership_id] [int] NULL,
	[enrollment_id] [int] NULL,
	[purpose] [nvarchar](30) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[currency] [nvarchar](3) NOT NULL,
	[status] [nvarchar](30) NOT NULL,
	[provider] [nvarchar](30) NOT NULL,
	[reference] [nvarchar](80) NOT NULL,
	[provider_reference] [nvarchar](255) NULL,
	[md5_hash] [nvarchar](32) NULL,
	[bakong_account_id] [nvarchar](255) NULL,
	[merchant_name] [nvarchar](100) NULL,
	[merchant_city] [nvarchar](100) NULL,
	[qr_payload] [nvarchar](2048) NULL,
	[qr_image_data_uri] [nvarchar](max) NULL,
	[metadata_json] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[expires_at] [datetime2](7) NOT NULL,
	[paid_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[payment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[reference] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_roles]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_roles](
	[role_id] [int] IDENTITY(1,1) NOT NULL,
	[role_name] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_staff_detail]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_staff_detail](
	[staff_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[dob] [datetime2](7) NULL,
	[place_of_birth] [nvarchar](100) NULL,
	[phone] [nvarchar](50) NULL,
	[salary] [decimal](18, 2) NOT NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[staff_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_trainer]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_trainer](
	[trainer_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[trainer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_trainer_skill]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_trainer_skill](
	[skill_id] [int] IDENTITY(1,1) NOT NULL,
	[skill_name] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[skill_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[skill_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_trainer_skill_map]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_trainer_skill_map](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[trainer_id] [int] NOT NULL,
	[skill_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[trainer_id] ASC,
	[skill_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tbl_users]    Script Date: 16/05/2026 1:42:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_users](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[full_name] [nvarchar](100) NOT NULL,
	[username] [nvarchar](100) NOT NULL,
	[gender] [nvarchar](1) NULL,
	[email] [nvarchar](100) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[role_id] [int] NOT NULL,
	[is_active] [bit] NOT NULL,
	[email_verified_at] [datetime2](7) NULL,
	[create_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[tbl_client_memberships] ADD  DEFAULT ((0)) FOR [price]
GO
ALTER TABLE [dbo].[tbl_client_memberships] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tbl_courses] ADD  DEFAULT ((0)) FOR [price]
GO
ALTER TABLE [dbo].[tbl_courses] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tbl_courses] ADD  DEFAULT (getutcdate()) FOR [create_at]
GO
ALTER TABLE [dbo].[tbl_courses_room] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[tbl_courses_room] ADD  DEFAULT ((0)) FOR [is_approved]
GO
ALTER TABLE [dbo].[tbl_daily_customer_tracking] ADD  DEFAULT (getutcdate()) FOR [checkin_date]
GO
ALTER TABLE [dbo].[tbl_daily_customer_tracking] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[tbl_membership_plans] ADD  DEFAULT ((0)) FOR [price]
GO
ALTER TABLE [dbo].[tbl_membership_plans] ADD  DEFAULT ((1)) FOR [duration_months]
GO
ALTER TABLE [dbo].[tbl_membership_plans] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tbl_membership_plans] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[tbl_otp_challenges] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[tbl_otp_challenges] ADD  DEFAULT ((0)) FOR [attempts]
GO
ALTER TABLE [dbo].[tbl_payments] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[tbl_payments] ADD  DEFAULT ('USD') FOR [currency]
GO
ALTER TABLE [dbo].[tbl_payments] ADD  DEFAULT ('Pending') FOR [status]
GO
ALTER TABLE [dbo].[tbl_payments] ADD  DEFAULT ('BakongKHQR') FOR [provider]
GO
ALTER TABLE [dbo].[tbl_payments] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[tbl_staff_detail] ADD  DEFAULT ((0)) FOR [salary]
GO
ALTER TABLE [dbo].[tbl_staff_detail] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tbl_trainer] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tbl_users] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tbl_users] ADD  DEFAULT (getutcdate()) FOR [create_at]
GO
ALTER TABLE [dbo].[tbl_client_detail]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[tbl_users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[tbl_client_memberships]  WITH CHECK ADD FOREIGN KEY([client_id])
REFERENCES [dbo].[tbl_client_detail] ([client_id])
GO
ALTER TABLE [dbo].[tbl_courses]  WITH CHECK ADD FOREIGN KEY([skill_id])
REFERENCES [dbo].[tbl_trainer_skill] ([skill_id])
GO
ALTER TABLE [dbo].[tbl_courses]  WITH CHECK ADD FOREIGN KEY([trainer_id])
REFERENCES [dbo].[tbl_trainer] ([trainer_id])
GO
ALTER TABLE [dbo].[tbl_courses_room]  WITH CHECK ADD FOREIGN KEY([client_id])
REFERENCES [dbo].[tbl_client_detail] ([client_id])
GO
ALTER TABLE [dbo].[tbl_courses_room]  WITH CHECK ADD FOREIGN KEY([course_id])
REFERENCES [dbo].[tbl_courses] ([course_id])
GO
ALTER TABLE [dbo].[tbl_daily_customer_tracking]  WITH CHECK ADD FOREIGN KEY([client_id])
REFERENCES [dbo].[tbl_client_detail] ([client_id])
GO
ALTER TABLE [dbo].[tbl_otp_challenges]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[tbl_users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[tbl_payments]  WITH CHECK ADD FOREIGN KEY([client_id])
REFERENCES [dbo].[tbl_client_detail] ([client_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[tbl_payments]  WITH CHECK ADD FOREIGN KEY([enrollment_id])
REFERENCES [dbo].[tbl_courses_room] ([enrollment_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[tbl_payments]  WITH CHECK ADD FOREIGN KEY([membership_id])
REFERENCES [dbo].[tbl_client_memberships] ([membership_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[tbl_staff_detail]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[tbl_users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[tbl_trainer]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[tbl_users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[tbl_trainer_skill_map]  WITH CHECK ADD FOREIGN KEY([skill_id])
REFERENCES [dbo].[tbl_trainer_skill] ([skill_id])
GO
ALTER TABLE [dbo].[tbl_trainer_skill_map]  WITH CHECK ADD FOREIGN KEY([trainer_id])
REFERENCES [dbo].[tbl_trainer] ([trainer_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[tbl_users]  WITH CHECK ADD FOREIGN KEY([role_id])
REFERENCES [dbo].[tbl_roles] ([role_id])
GO