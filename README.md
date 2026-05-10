# GymPro Management System

Full-stack gym management app — .NET 8 API + vanilla JS frontend, all on **port 5000**.

Now includes 6-digit email OTP verification for login/registration and Bakong KHQR payment intents for membership purchases.

---

## Quick Start

### 1. Run the SQL script
Open SQL Server Management Studio (SSMS) and run:
```
GymManagementDB.sql
```
This creates the database, all tables, and seeds 10 members, 4 trainers, 5 courses, and sample data.

### 2. Run the API
```bash
dotnet run --project GymApi.csproj
```
Then open: **http://localhost:5000**

**Default admin login:** `ahboy5518@gmail.com` / `sethadmin`

For local development, `Email:Enabled` is `false`, so OTP codes are written to the API logs. OTP codes expire after 5 minutes. For production, configure Gmail SMTP in `.env` with a Gmail app password.

---

## Project Structure

```
GymApi/
├── Controllers/Controllers.cs   — All API endpoints
├── Data/GymDbContext.cs          — EF Core mappings (tbl_* tables)
├── DTOs/Dtos.cs                  — Request/Response records
├── Models/Entities.cs            — Domain entities
├── Services/Services.cs          — JWT + Auth + Dashboard
├── Middlewares/Middlewares.cs    — Exception + Request logging
├── Program.cs                    — App startup, port 5000
├── appsettings.json              — DB connection, JWT, rate limiting
├── GymManagementDB.sql           — Full SQL schema + seed data
└── wwwroot/
    ├── index.html                — Login page
    ├── app.html                  — Main dashboard
    ├── css/variables.css         — CSS design tokens (dark/light)
    ├── css/main.css              — All styles
    ├── js/api.js                 — API client (all endpoints)
    └── js/app.js                 — Dashboard logic (all pages)
```

---

## API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/login | Public, sends OTP |
| POST | /api/auth/verify-otp | Public, returns JWT |
| POST | /api/public/register | Public, creates client + sends OTP |
| GET | /api/dashboard/stats | Admin, Staff |
| GET/POST | /api/members | Admin, Staff |
| GET | /api/members/{id}/checkins | Authenticated |
| GET | /api/members/{id}/memberships | Authenticated |
| GET/POST | /api/trainers | Authenticated |
| PUT | /api/trainers/{id}/toggle | Admin |
| GET/POST | /api/courses | Authenticated |
| DELETE | /api/courses/{id} | Admin |
| GET/POST | /api/memberships | Admin, Staff |
| DELETE | /api/memberships/{id} | Admin, Staff |
| GET/POST | /api/checkins | Admin, Staff |
| GET/POST | /api/staff | Admin |
| PUT | /api/staff/{id} | Admin |
| GET/POST | /api/enrollments | Admin, Staff |
| GET/POST | /api/skills | Authenticated |
| GET/POST | /api/users | Admin, Staff |
| PATCH | /api/users/{id}/reset-password | Admin |
| GET | /api/payments | Admin, Staff |
| POST | /api/payments/khqr/membership | Authenticated |
| PATCH | /api/payments/{id}/confirm | Admin, Staff |
| GET | /swagger | Public (dev) |

KHQR note: the API generates a Bakong KHQR-compatible EMV payload and QR image. Actual bank settlement/webhook verification still depends on your Bakong provider credentials; staff can confirm a pending payment in the dashboard to activate the membership.
The payment intent stores the KHQR MD5 and can call Bakong Open API `check_transaction_by_md5` when `Khqr__ApiBaseUrl`/`Khqr__ApiToken` or `BAKONG_BASE_URL`/`BAKONG_ACCESS_TOKEN` are configured. Payment QR codes expire after 10 minutes.

---

## Production Checklist

- [ ] Change `JwtSettings:SecretKey` in `appsettings.json` to a strong random string
- [ ] Update `ConnectionStrings:DefaultConnection` with production DB credentials
- [ ] Configure Gmail SMTP values in `.env` (`Email__Username`, `Email__Password`, `Email__FromEmail`)
- [ ] Configure Bakong merchant values in `.env` (`Khqr__BakongAccountId`/`BAKONG_MERCHANT_ACCOUNT_ID`, `Khqr__MerchantName`/`BAKONG_MERCHANT_NAME`)
- [ ] Configure Bakong Open API MD5 verification values (`Khqr__ApiBaseUrl`/`BAKONG_BASE_URL`, `Khqr__ApiToken`/`BAKONG_ACCESS_TOKEN`)
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Change `appsettings.Production.json` log level to `Warning`
- [ ] Configure a reverse proxy (nginx/IIS) in front of port 5000 for HTTPS

## Docker Deployment

Edit `.env`, then build and start:

```bash
docker compose build gympro
docker compose up -d
```

The compose file starts SQL Server and the API. This project does not use EF migrations yet, so run `GymManagementDB.sql` against the SQL Server container or your production SQL Server before opening the app.

---

## Roles

| Role ID | Name | Access |
|---------|------|--------|
| 1 | Admin | Full access |
| 2 | Staff | Members, checkins, courses, memberships |
| 3 | Trainer | Read-only trainers/courses |
| 4 | Client | Own profile only |
