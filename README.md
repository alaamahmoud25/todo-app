# My Tasks

A daily task manager with a Django REST API backend and a Next.js frontend. Each user signs in to their own account and sees only their own tasks. The interface is available in Arabic and English, with light and dark themes.

## Features

- Accounts with sign-up, login, and logout. Every task belongs to one user, and the API never returns another user's data.
- Tasks with a title, notes, category, priority, and an optional due date and time.
- Reminders before the due date (at due time, 5, 15, 30, or 60 minutes before, or one day before). A reminder shows a browser notification, an in-page alert, and a short sound.
- Daily and weekly repeating tasks. Completing one creates the next occurrence automatically. If you missed a few days, the next one is scheduled in the future rather than in the past.
- Views for today, overdue, upcoming, and completed tasks, plus search and filters by category and priority.
- A statistics page with tasks completed over the last 7 days, remaining tasks by category and by priority, and an overall completion rate.
- Arabic (right to left) and English (left to right) interfaces. Dates and relative times ("in 2 hours") follow the selected language.
- A Django admin panel in both languages at `/ar/admin/` and `/en/admin/`.

All times use the `Africa/Cairo` time zone.

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Python, Django 6.1, Django REST Framework 3.18, django-cors-headers, SQLite |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Recharts |
| Auth | DRF token authentication |

## Requirements

- Python 3.12 or newer
- Node.js 20.9 or newer

Check your versions with:

```powershell
python --version
node --version
```

## Getting started on Windows

The project ships with two scripts in the root folder.

1. Run `setup.bat` once. It creates a Python virtual environment, installs the backend and frontend dependencies, creates the database, and asks you to create an admin account.
2. Run `start.bat` whenever you want to use the app. It opens one window for Django and one for Next.js, then opens http://localhost:3000 in your browser.

To stop the app, close both windows.

## Manual setup

Use two terminals, one for each server.

Backend:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

On macOS or Linux, activate the virtual environment with `source venv/bin/activate` instead.

After the first run, you only need `venv\Scripts\activate` and `python manage.py runserver` for the backend, and `npm run dev` for the frontend.

## Using the app

Open http://localhost:3000. You will be redirected to the login page. Create an account, or log in with the admin account you created during setup.

To receive reminders, click the bell icon in the header and allow notifications when the browser asks. Reminders work while the app is open in any browser tab. The frontend checks the server for due reminders every 30 seconds.

If you upgrade a database that already had tasks before accounts were added, `migrate` assigns those tasks to the first superuser, provided one exists at that point.

## URLs

| URL | Description |
|---|---|
| http://localhost:3000 | Tasks |
| http://localhost:3000/stats | Statistics |
| http://localhost:3000/login | Login and sign-up |
| http://127.0.0.1:8000/api/ | Browsable API |
| http://127.0.0.1:8000/ar/admin/ | Admin (Arabic) |
| http://127.0.0.1:8000/en/admin/ | Admin (English) |

## Project structure

```
todo-app/
├── setup.bat                    First-time setup
├── start.bat                    Starts both servers
├── backend/
│   ├── config/
│   │   ├── settings.py          Language, time zone, CORS, auth settings
│   │   └── urls.py              API and localized admin routes
│   └── tasks/
│       ├── models.py            Category and Task, repeat and reminder logic
│       ├── serializers.py       JSON conversion and validation
│       ├── views.py             Task API: filters, toggle, summary, stats, reminders
│       ├── auth_views.py        Login, sign-up, current user, logout
│       ├── tests.py             API tests
│       └── migrations/          Includes the default categories
└── frontend/
    ├── app/
    │   ├── page.tsx             Task list
    │   ├── stats/page.tsx       Statistics
    │   ├── login/page.tsx       Login and sign-up
    │   └── layout.tsx           Root layout and providers
    ├── components/
    │   ├── AuthProvider.tsx     Current user and route guard
    │   ├── LanguageProvider.tsx Language and text direction
    │   ├── ThemeProvider.tsx    Light and dark theme
    │   ├── ReminderWatcher.tsx  Polls for reminders and shows alerts
    │   ├── TaskForm.tsx         Add and edit dialog
    │   └── ...
    └── lib/
        ├── api.ts               API client (attaches the auth token)
        ├── format.ts            Date and time formatting
        └── i18n/                Arabic and English dictionaries
```

## API reference

Every endpoint except login and sign-up requires this header:

```
Authorization: Token <token>
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Create an account. Returns a token. |
| POST | `/api/auth/login/` | Log in. Returns a token. |
| GET | `/api/auth/me/` | Current user |
| POST | `/api/auth/logout/` | Revoke the token |
| GET, POST | `/api/tasks/` | List or create tasks |
| GET, PUT, PATCH, DELETE | `/api/tasks/<id>/` | Read, update, or delete a task |
| POST | `/api/tasks/<id>/toggle/` | Mark a task done or not done |
| GET | `/api/tasks/summary/` | Counts for today, overdue, pending, and done today |
| GET | `/api/tasks/stats/` | Data for the statistics page |
| GET | `/api/tasks/reminders/` | Tasks whose reminder time has arrived |
| POST | `/api/tasks/<id>/mark_reminded/` | Mark a reminder as sent |
| GET, POST | `/api/categories/` | List or create categories |

`GET /api/tasks/` accepts these query parameters:

| Parameter | Values |
|---|---|
| `view` | `today`, `overdue`, `upcoming`, `done` |
| `category` | Category id |
| `priority` | `high`, `medium`, `low` |
| `search` | Text matched against the title and notes |

Errors from the auth endpoints come back as codes in the `detail` field (for example `invalid_credentials`, `username_taken`, or `weak_password`). The frontend maps each code to a message in the current language.

## Configuration

The frontend reads the API address from `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Restart `npm run dev` after changing this file.

Backend settings live in `backend/config/settings.py`. The ones you are most likely to change are `TIME_ZONE` (default `Africa/Cairo`), `LANGUAGE_CODE` (default `ar`), and `CORS_ALLOWED_ORIGINS`, which must include the address the frontend runs on.

## Running the tests

```powershell
cd backend
python manage.py test
```

The test suite covers task filters, completion, repeating tasks, reminders, statistics, the auth endpoints, and a check that one user cannot read or delete another user's tasks.

For the frontend:

```powershell
cd frontend
npm run lint
npm run build
```

## Troubleshooting

| Problem | Fix |
|---|---|
| The page says it can't reach the server | Make sure the Django window is running without errors and that `CORS_ALLOWED_ORIGINS` includes `http://localhost:3000`. |
| `no such table` | Run `python manage.py migrate` in the backend folder. |
| `Module not found` | Run `npm install` in the frontend folder. |
| Requests go to `undefined/...` | `frontend/.env.local` is missing or misnamed. Create it next to `package.json` and restart `npm run dev`. |
| `Port 3000 is in use` or `Port 8000 is in use` | Another copy of the app is still running. Close it or restart the computer. |
| `'next' is not recognized` | The frontend dependencies didn't finish installing. Run `npm install` again. |

## Before deploying

The default settings are meant for local development. Before putting the app online:

- Serve both the frontend and the API over HTTPS.
- Set `DEBUG = False` and move `SECRET_KEY` into an environment variable.
- Add the backend domain to `ALLOWED_HOSTS`.
- Replace the local origins in `CORS_ALLOWED_ORIGINS` with the real frontend domain.
- Set `NEXT_PUBLIC_API_URL` to the real API address in your hosting settings.

The auth token is stored in the browser's `localStorage`. That is a common choice for small apps, but it means a cross-site scripting bug could expose the token, so avoid rendering user-supplied HTML.
