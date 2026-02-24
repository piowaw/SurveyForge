# SurveyForge

A production-ready survey platform with authentication, survey builder, real-time collaboration, public sharing, timed surveys, response collection, results analytics with charts, CSV/Excel export, admin panel, Swagger API docs, and full PL/EN internationalisation.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite 7, shadcn/ui, Tailwind CSS v4, React Router 7, TanStack Query 5, Zod 4, react-hook-form 7, @dnd-kit |
| Backend | PHP 8.4 / Laravel 12 (API-only), Sanctum 4, l5-swagger 8.6, PhpOffice/PhpSpreadsheet 5 |
| Database | PostgreSQL 15 |
| Testing | PHPUnit 11 (backend), Vitest 4 + Testing Library (frontend) |
| DevOps | Docker Compose (4 services: API, Frontend, PostgreSQL, pgAdmin) |

## Features

- **8 question types** — Short Text, Long Text, Single Choice, Multiple Choice, Number, File Upload, Ranking (drag-and-drop), Code
- **Survey settings** — scheduling (start/end dates), time limits, access passwords, respondent name/email gates, theme colours, banner images
- **Question display modes** — all-at-once, paginated (grouped), one-per-page
- **Post-submit review** — respondents can review answers with correct-answer highlighting
- **Collaboration** — invite editors & viewers by email with role-based permissions
- **Results dashboard** — aggregated stats, bar charts, individual response detail dialog
- **Export** — CSV and Excel (XLSX) downloads
- **Admin panel** — manage all users and surveys (admin-only)
- **Favourites & duplication** — star surveys, duplicate with one click
- **i18n** — full Polish and English UI with language switcher in user menu and on public pages
- **Dynamic page titles** — each page sets a descriptive browser tab title (e.g. *My Survey | SurveyForge*)
- **Swagger UI** — interactive API documentation at `/docs/swagger`
- **reCAPTCHA v2** — on login and registration forms

## Prerequisites

- **Docker & Docker Compose**

## Quick Start with Docker

```bash
docker compose up --build -d
```

Wait ~30 s for migrations & seeder, then open:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api |
| Swagger UI | http://localhost:8000/docs/swagger |
| pgAdmin | http://localhost:5050 (`admin@admin.com` / `admin`) |

## Running Tests

### Backend (PHPUnit) — 60 tests

```bash
docker exec surveyforge-api php artisan test
```

### Frontend (Vitest) — 20 tests

```bash
docker exec surveyforge-frontend npm test
```

## Demo Accounts (from seeder)

| Email | Password | Role |
|---|---|---|
| `demo@surveyforge.local` | `password` | Admin / survey owner |
| `alice@surveyforge.local` | `password` | Regular user |
| `bob@surveyforge.local` | `password` | Regular user |

The seeder creates 7 sample surveys with diverse question types and several pre-filled responses.

## Environment Variables

### Backend (.env)

| Variable | Default | Description |
|---|---|---|
| `DB_CONNECTION` | `pgsql` | Database driver |
| `DB_HOST` | `postgres` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_DATABASE` | `surveyforge` | Database name |
| `DB_USERNAME` | `surveyforge` | Database user |
| `DB_PASSWORD` | `secret` | Database password |

### Frontend (.env)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API base URL |

## API Endpoints

The full OpenAPI 3.0.3 spec is at [`backend/openapi.yaml`](backend/openapi.yaml) and browsable via **Swagger UI** at `http://localhost:8000/docs/swagger`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/me` | Bearer | Get profile |
| PUT | `/api/me` | Bearer | Update profile |
| PUT | `/api/me/password` | Bearer | Change password |
| DELETE | `/api/me` | Bearer | Delete account |
| GET | `/api/surveys` | Bearer | List own + collaborated surveys |
| POST | `/api/surveys` | Bearer | Create survey |
| GET | `/api/surveys/{id}` | Bearer | Get survey with questions & collaborators |
| PUT | `/api/surveys/{id}` | Bearer | Update survey settings |
| DELETE | `/api/surveys/{id}` | Bearer | Delete survey (owner only) |
| POST | `/api/surveys/{id}/publish` | Bearer | Toggle publish / unpublish |
| POST | `/api/surveys/{id}/favorite` | Bearer | Toggle favourite |
| POST | `/api/surveys/{id}/duplicate` | Bearer | Duplicate survey with questions |
| POST | `/api/surveys/{id}/questions` | Bearer | Add question |
| PUT | `/api/questions/{id}` | Bearer | Update question |
| DELETE | `/api/questions/{id}` | Bearer | Delete question |
| POST | `/api/surveys/{id}/questions/reorder` | Bearer | Reorder questions |
| POST | `/api/surveys/{id}/collaborators` | Bearer | Add collaborator |
| DELETE | `/api/surveys/{id}/collaborators/{userId}` | Bearer | Remove collaborator |
| GET | `/api/public/surveys/{slug}` | No | Get published survey |
| POST | `/api/public/surveys/{slug}/responses` | No | Submit response |
| GET | `/api/surveys/{id}/results` | Bearer | Aggregated results |
| GET | `/api/surveys/{id}/responses` | Bearer | Individual responses |
| DELETE | `/api/responses/{id}` | Bearer | Delete a response |
| GET | `/api/surveys/{id}/export?format=csv\|xlsx` | Bearer | Export responses |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/{id}` | Admin | Update user |
| DELETE | `/api/admin/users/{id}` | Admin | Delete user |
| GET | `/api/admin/surveys` | Admin | List all surveys |
| DELETE | `/api/admin/surveys/{id}` | Admin | Delete any survey |
