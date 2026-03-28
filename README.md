# GymPro Management System

Full-stack gym management app — .NET 8 API + vanilla JS frontend, all on **port 5000**.

---

## Quick Start (3 steps)

### 1. Run the SQL script
Open SQL Server Management Studio (SSMS) and run:
```
GymManagementDB.sql
```
This creates the database, all tables, and seeds 10 members, 4 trainers, 5 courses, and sample data.

### 2. Set real password hashes
The SQL seed uses a placeholder hash. After starting the API once, visit:
```
http://localhost:5000/api/setup/seed-passwords
```
This sets proper BCrypt hashes for all users. You should see `"readyToLogin": true`.

> ⚠️ **Delete `SetupController` from `Controllers/Controllers.cs` before production deployment.**

### 3. Run the API
```bash
cd GymApi
dotnet run
```
Then open: **http://localhost:5000**

**Default login:** `admin` / `Admin@123`

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
| POST | /api/auth/login | Public |
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
| GET | /swagger | Public (dev) |

---

## Production Checklist

- [ ] Change `JwtSettings:SecretKey` in `appsettings.json` to a strong random string
- [ ] Update `ConnectionStrings:DefaultConnection` with production DB credentials
- [ ] Delete `SetupController` from `Controllers/Controllers.cs`
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Change `appsettings.Production.json` log level to `Warning`
- [ ] Configure a reverse proxy (nginx/IIS) in front of port 5000 for HTTPS

---

## Roles

| Role ID | Name | Access |
|---------|------|--------|
| 1 | Admin | Full access |
| 2 | Staff | Members, checkins, courses, memberships |
| 3 | Trainer | Read-only trainers/courses |
| 4 | Client | Own profile only |
