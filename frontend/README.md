# AIUB UniAssist

A React + Vite + Tailwind frontend for your FastAPI university backend
(Departments / Students / Courses / Enrollments) and the UniAssist AI (RAG) chat.

## 1. Run the backend first

```bash
cd your-backend-project
uvicorn app.main:app --reload
```

It should be reachable at `http://127.0.0.1:8000`.

### ⚠️ Required: enable CORS on the backend

Browsers block cross-origin requests by default, so your FastAPI app needs
CORS middleware or every request from this frontend will fail silently (or
show a "Network Error" toast). Add this to your `app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

By default the app calls `http://127.0.0.1:8000`. To point at a different
backend URL, copy `.env.example` to `.env` and change `VITE_API_URL`.

## Project structure

```
frontend/
├─ src/
│  ├─ api/              axios calls, one file per resource (axiosClient, departmentApi, studentApi,
│  │                    courseApi, enrollmentApi, ragApi)
│  ├─ components/       forms, sidebar, modal, stat cards, table search, chat box,
│  │                    AnimatedParticleBackground
│  ├─ pages/            Dashboard, Departments, Students, Courses, Enrollments, UniAssist,
│  │                    GlobalSearchPage, SystemHealthPage, SettingsPage
│  ├─ context/          toast notification provider
│  ├─ App.jsx           layout, routes, particle on/off preference
│  └─ main.jsx          entry point
└─ package.json
```

## Floating particle background

`AnimatedParticleBackground.jsx` draws slow dots on a full-screen `<canvas>` behind the app.
It never blocks clicks (`pointer-events: none`), pauses when the tab is hidden, shows a still
frame when your system asks for reduced motion, and can be switched off on the Settings page.

## Extra pages

- **Global search** filters data from the existing list endpoints in the browser.
- **System health** calls the existing list endpoints and shows status and response time.
  It does not call `POST /api/chat` (that would run a real RAG query). A richer check would need
  a backend `GET /health` endpoint, which this frontend does not assume exists.
- **Settings** toggles the particles and shows the API address (set it with `VITE_API_URL`).

## Notes on the backend routes this UI depends on

| Resource     | Methods used                                                                 |
|--------------|-------------------------------------------------------------------------------|
| Departments  | `POST /departments/`, `GET /departments/`, `DELETE /departments/{id}`         |
| Students     | `POST /students/`, `GET /students/`, `PUT /students/{id}`, `DELETE /students/{id}` |
| Courses      | `POST /courses/`, `GET /courses/`, `PUT /courses/{id}`, `DELETE /courses/{id}`|
| Enrollments  | `POST /enrollments/`, `GET /enrollments/`, `DELETE /enrollments/{id}`, `GET /enrollments/students/{id}/courses`, `GET /enrollments/courses/{id}/students` |

The last two enrollment lookups are nested under the `/enrollments` router in
your code (not bare `/students/{id}/courses`), so the frontend calls the full
prefixed path — this is what powers the "Quick lookup" panel on the
Enrollments page.

## A couple of small things worth fixing in the backend

These don't block the UI (FastAPI/Pydantic falls back gracefully in dev), but
worth cleaning up:

- `schemas/student.py` → `StudentResponse.Config` has a typo: `from_attribute`
  should be `from_attributes`.
- `schemas/course.py` → `class config` should be capitalized `class Config`
  to match Pydantic's convention.
