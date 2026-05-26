# AI Job Portal — Phase 1: Foundation & Architecture

> **Stack:** Spring Boot 3.3 · React 18 · MySQL 8.0 · JWT · TypeScript · Tailwind CSS  
> **Phase:** 1 of 6 (Sprints 1–2, Weeks 1–4)

---

## What's Included in Phase 1

### Backend (Spring Boot)
| Area | Details |
|---|---|
| **Project scaffold** | Maven multi-module, Java 21, Spring Boot 3.3 |
| **Database schema** | All 13 tables with indexes, FKs, full-text indexes |
| **JWT Auth** | JJWT 0.12, BCrypt strength-12, access + refresh tokens |
| **User registration** | All 4 roles, email uniqueness, password validation |
| **Login** | Credentials check, `last_login` update, 423 on suspended |
| **Token refresh** | Server-side revocation, rotation on every refresh |
| **Logout** | Revokes all refresh tokens for the user |
| **RBAC** | `@EnableMethodSecurity`, endpoint-level role guards |
| **Global exception handler** | `ApiResponse<T>` envelope for all errors |
| **File storage** | AWS S3 service with resume upload & validation |
| **Email service** | Async SMTP via JavaMailSender (SendGrid-ready) |
| **Admin endpoints** | Dashboard stats, paginated user list, toggle status |
| **Skill taxonomy** | 40 canonical skills seeded on startup |
| **Admin user seed** | `admin@jobportal.com` / `Admin@1234` auto-created |
| **OpenAPI / Swagger** | Bearer-auth Swagger UI at `/api/swagger-ui.html` |
| **CORS** | Configurable via `ALLOWED_ORIGINS` env var |

### Frontend (React 18 + TypeScript)
| Area | Details |
|---|---|
| **Scaffold** | Vite, TypeScript strict, path aliases (`@/`) |
| **Design system** | Tailwind CSS, DM Sans + Syne fonts, brand tokens |
| **Auth store** | Zustand with selective persistence |
| **Axios client** | JWT interceptor, silent refresh on 401, request queue |
| **Login page** | Validation, show/hide password, role-based redirect |
| **Register page** | Visual role picker, Zod schema, all 3 public roles |
| **Layout** | Sidebar nav, role-aware menu, top bar |
| **Role dashboards** | Seeker / Provider / Trainer / Admin stub dashboards |
| **Admin dashboard** | Live stats from API with loading skeletons |
| **Admin users page** | Paginated table, client-side search, toggle status |
| **Protected routes** | Auth guard + role guard via React Router |
| **Toast notifications** | `react-hot-toast` for all feedback |

### Infrastructure
| Area | Details |
|---|---|
| **Docker** | Multi-stage Dockerfiles for backend and frontend |
| **Docker Compose** | Full local stack: MySQL + Backend + Frontend + MailHog |
| **GitHub Actions** | CI: build, test, Docker image push to GHCR |
| **Nginx** | SPA routing, API proxy, security headers, asset caching |

---

## Quick Start

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone and enter project
git clone <repo-url> && cd jobportal

# 2. Start the full stack
docker compose up --build

# 3. Access the app
#    Frontend:   http://localhost:3000
#    Backend:    http://localhost:8080/api
#    Swagger UI: http://localhost:8080/api/swagger-ui.html
#    MailHog:    http://localhost:8025
```

Default admin credentials: `admin@jobportal.com` / `Admin@1234`

---

### Option B — Local Development

#### Prerequisites
- Java 21+
- Node 20+
- MySQL 8.0 running locally

#### 1. Database setup

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

#### 2. Backend

```bash
cd backend

# Set environment variables (or create application-local.properties)
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=<base64-encoded-256-bit-secret>

mvn spring-boot:run
# API: http://localhost:8080/api
# Swagger: http://localhost:8080/api/swagger-ui.html
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## Environment Variables Reference

### Backend

| Variable | Default | Description |
|---|---|---|
| `DB_USERNAME` | `root` | MySQL username |
| `DB_PASSWORD` | `password` | MySQL password |
| `JWT_SECRET` | (base64 key) | 256-bit JWT signing secret |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS origins (comma-separated) |
| `MAIL_HOST` | `smtp.sendgrid.net` | SMTP host |
| `MAIL_PASSWORD` | — | SMTP password / SendGrid API key |
| `AWS_S3_BUCKET` | `jobportal-files` | S3 bucket name |
| `AWS_ACCESS_KEY` | — | AWS access key |
| `AWS_SECRET_KEY` | — | AWS secret key |
| `AWS_REGION` | `ap-south-1` | AWS region |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Backend API base URL |

---

## API Reference

### Authentication (Public)

```
POST /api/auth/register    — Register (ROLE_JOB_SEEKER / ROLE_JOB_PROVIDER / ROLE_TRAINING_PROVIDER)
POST /api/auth/login       — Login → { accessToken, refreshToken, user }
POST /api/auth/refresh     — { refreshToken } → new tokens
POST /api/auth/logout      — Revoke all refresh tokens (requires Bearer token)
```

### Admin (ROLE_ADMIN)

```
GET   /api/admin/dashboard              — Platform stats
GET   /api/admin/users?page=0&size=20  — Paginated user list
PATCH /api/admin/users/{id}/toggle-status — Activate / suspend user
```

### Skills (Public)

```
GET /api/skills/search?q=java  — Search skill taxonomy
GET /api/skills                — All 40 canonical skills
```

### Response envelope

```json
{
  "success": true,
  "message": "Login successful",
  "data": { "accessToken": "...", "refreshToken": "...", "user": { ... } },
  "error": null,
  "timestamp": "2026-05-09T10:30:00"
}
```

---

## Project Structure

```
jobportal/
├── backend/
│   ├── src/main/java/com/jobportal/
│   │   ├── config/          # SecurityConfig, OpenApiConfig, DataSeeder
│   │   ├── controller/      # AuthController, AdminController, SkillController
│   │   ├── dto/             # ApiResponse, AuthResponse, request DTOs
│   │   ├── entity/          # User, RefreshToken, Skill
│   │   ├── exception/       # BusinessException, GlobalExceptionHandler
│   │   ├── repository/      # JPA repositories
│   │   ├── security/        # JwtUtils, JwtAuthenticationFilter
│   │   └── service/         # AuthService, AdminService, EmailService, FileStorageService
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── schema.sql       # Full DB schema (all 13 tables)
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT interceptors
│   │   ├── components/      # Layout (sidebar + header)
│   │   ├── pages/           # Login, Register, Dashboards, Admin pages
│   │   ├── store/           # Zustand auth store
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .github/workflows/ci.yml
└── docker-compose.yml
```

---

## Security Checklist (Phase 1)

- [x] BCrypt password hashing (strength 12)
- [x] JWT access tokens (1 hour expiry)
- [x] Refresh tokens stored server-side with revocation
- [x] Token rotation on every refresh
- [x] RBAC via Spring Security method security
- [x] 423 Locked response for suspended accounts
- [x] CORS locked to configured origins
- [x] SQL injection prevention via JPA parameterised queries
- [x] File type and size validation before S3 upload
- [x] Admin cannot be registered via public endpoint
- [x] Admin self-suspension prevention

---

## What Comes Next

| Phase | Focus |
|---|---|
| **Phase 2** | Job Seeker profile, resume upload, job search, apply, tracker |
| **Phase 3** | Job Provider: company profile, job posting, ATS pipeline |
| **Phase 4** | Training Provider: courses, video upload, enrolments, certificates |
| **Phase 5** | AI microservice: job matching, skill gaps, training recommendations |
| **Phase 6** | Admin panel, security audit, performance tuning, production launch |
