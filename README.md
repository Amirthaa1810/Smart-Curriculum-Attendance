# 🎓 Smart Curriculum Activity & Attendance

> **Attend. Plan. Learn.**

A complete full-stack hackathon prototype that combines **QR attendance**, **smart timetables**, **automatic free-period detection**, **personalized academic planning** and **analytics** into one platform for students and teachers.

---

## ✨ Features

### Authentication (JWT + bcrypt)
- Role-based login for **Student** and **Teacher**
- Protected routes with `Authorization: Bearer <token>`
- Hashing of passwords with bcrypt

### QR Attendance
- Teacher selects **Class → Subject → Period** and clicks **Generate QR**
- Every session gets a **unique, time-limited QR code** (never a static QR)
- Live **countdown/expiry** on the teacher screen
- Student scans with the **in-app camera** (`html5-qrcode`)
- Backend validates: logged-in student · valid token · session not expired · student belongs to class · **no duplicate**
- Success message: **✓ Attendance Marked Successfully**
- Teacher dashboard shows **live marks** automatically (5s polling)

### Attendance
- Percentages **computed dynamically** from the database — nothing hardcoded
- Overall %, subject-wise %, progress bars, full history, and <75% warnings

### Timetable & Free Periods
- Weekly grid timetable (Mon–Sun, 5 periods/day)
- **Automatic free-period detection** from the timetable

### Personalized Planner (rule-based, no ML needed)
- Converts free periods into a daily study plan
- **Weak subjects (<75% attendance) are prioritized for revision**
- Suggestions: *Revise notes · Solve practice problems · Preview next class* etc.
- One-click "Auto-generate Tasks" and task completion tracking

### Analytics (Recharts)
- **Student:** overall %, subject-wise donut, 7-day bar trend, warnings
- **Teacher:** overall %, today's marks, class-wise donut, subject-wise bar, 14-day line trend, low-attendance student list

### UI/UX
- Modern SaaS look: sidebar navigation, cards, progress bars, toasts, responsive mobile/desktop
- Blue/indigo primary · green success · amber warning · red danger
- **Dark mode** (bonus, fully themed)

---

## 🚀 Quick Start

### Prerequisites
- Node.js **18+**
- A running MongoDB instance **or** none at all (see "Zero-install demo mode")

### 1) Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2) Configure environment

Copy `.env.example` → `.env` (backend folder) and set your values:

```env
MONGO_URI=mongodb://127.0.0.1:27017/smart_curriculum
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:5173
QR_SESSION_MINUTES=5
```

Frontend optional env (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

> **Note:** if `VITE_API_URL` is unset, the frontend uses the Vite proxy (already configured) → `http://localhost:5000/api`.

### 3) Seed the database

```bash
cd backend
npm run seed          # uses MONGO_URI from .env
```

### 4) Run

```bash
# Terminal 1 — backend
cd backend
npm run dev           # http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm run dev           # http://localhost:5173
```

---

## ⚡ Zero-install Demo Mode (no MongoDB needed)

The project bundles **`mongodb-memory-server`** so you can demo the whole app on any machine without installing MongoDB:

```bash
cd backend
npm run dev:memory    # starts in-memory Mongo → auto-seeds → runs API on :5000
```

Frontend runs the same way (`npm run dev` in `frontend/`).

---

## 🔑 Demo Credentials

| Role    | Email                | Password     |
| ------- | -------------------- | ------------ |
| Student | `student@demo.com`   | `student123` |
| Teacher | `teacher@demo.com`   | `teacher123` |

The seed creates:
- 1 teacher (Prof. Anita Sharma)
- 5 students (demo student: **Rahul Verma / STU2026001**)
- 1 class (**CSE 2nd Year B**)
- 4 subjects (**Data Structures · Mathematics · Digital Electronics · Management**)
- 1 week of timetable (Mon–Fri, **Period 3 is a FREE PERIOD**)
- ~3 weeks of attendance history (demo student ≈ 75%, **weak in Management**)
- Sample planner tasks for today

---

## 🎬 Demo Flow (the full story)

1. **Teacher login** → `teacher@demo.com` / `teacher123`
2. **Generate QR** → pick CSE 2nd Year B → Data Structures → Period 1 → *Generate QR*
3. **Student login** (new browser/incognito) → `student@demo.com` / `student123`
4. **Scan Attendance** → scan the QR with the camera (or Manual Entry)
5. **✓ Attendance Marked Successfully** → student's % updates instantly
6. **Teacher side** → live marks appear on the Generate QR page & Dashboard
7. **Timetable** → opens weekly grid, today highlighted
8. **Free Periods** → system detects the 11:00 free period
9. **Daily Planner** → personalized plan: *Revise Management notes (high priority — weak subject)*, *Preview Data Structures*, *Practice problems*
10. **Suggestions** → 3 activity suggestions with durations
11. **Analytics** → donut, bar, line charts + warnings

---

## 🏗️ Architecture

```
┌─────────────────┐   HTTP/JWT    ┌──────────────────────┐
│   React SPA     │ ───────────►  │   Express API        │
│  (Vite, :5173)  │               │   (Node, :5000)      │
│  Recharts/Lucide│               │  └─ Mongoose (ODM)   │
│  html5-qrcode   │               └──────────┬───────────┘
└─────────────────┘                          ▼
                                     ┌──────────────┐
                                     │   MongoDB    │
                                     └──────────────┘
```

**Backend structure**

| Path                     | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `backend/config/`        | env config + DB connection                |
| `backend/models/`        | Mongoose schemas                          |
| `backend/controllers/`   | route handlers (business logic)           |
| `backend/routes/`        | Express routers                           |
| `backend/middleware/`    | `protect`, `authorize`, error handlers    |
| `backend/services/`      | planner rules + analytics aggregation     |
| `backend/server.js`      | entry point                               |
| `database/seed.js`       | demo data seeder                          |

**Frontend structure**

| Path                            | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `frontend/src/pages/`           | route-level pages (student + teacher)    |
| `frontend/src/layouts/`         | sidebar app layout                       |
| `frontend/src/components/`      | cards, progress bars, charts, toasts     |
| `frontend/src/services/api.js`  | Axios client with auth interceptor       |
| `frontend/src/context/`         | AuthContext (JWT state)                  |
| `frontend/src/hooks/`, `utils/` | data hooks + formatters / toast helpers  |

---

## 📚 Database Models

| Model              | Fields                                                                     |
| ------------------ | -------------------------------------------------------------------------- |
| **User**           | name, email, passwordHash, role (`student`/`teacher`), studentId, teacherId, classId |
| **Class**          | name, section, teacherId, students[]                                       |
| **Subject**        | name, code, teacherId, classId                                             |
| **AttendanceSession** | classId, subjectId, teacherId, date, period, qrToken (unique), startTime, expiryTime, active |
| **Attendance**     | sessionId, studentId, classId, subjectId, date, timestamp, status (`present`/`absent`) |
| **Timetable**      | classId, day, period, subjectId, startTime, endTime, type (`class`/`free`) |
| **AcademicTask**   | studentId, title, description, category, duration, completed, date         |

---

## 🔌 API Reference

All endpoints (except login) require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint            | Role      | Description            |
| ------ | ------------------- | --------- | ---------------------- |
| POST   | `/api/auth/login`   | public    | Returns `{ token, user }` |
| GET    | `/api/auth/me`      | any       | Current user           |

### Classes
| Method | Endpoint              | Role    | Description                     |
| ------ | --------------------- | ------- | ------------------------------- |
| POST   | `/api/classes`        | teacher | Create class (+ subjects)       |
| GET    | `/api/classes`        | teacher | List classes w/ students+subjects |
| GET    | `/api/classes/:id`    | teacher | Class detail                    |
| POST   | `/api/classes/:id/students` | teacher | Add student                 |
| DELETE | `/api/classes/:id/students/:studentId` | teacher | Remove student |

### Attendance
| Method | Endpoint                      | Role    | Description                        |
| ------ | ----------------------------- | ------- | ---------------------------------- |
| POST   | `/api/attendance/session`     | teacher | Create QR session (returns QR data URL) |
| GET    | `/api/attendance/session/:id` | any     | Session detail + live marks        |
| POST   | `/api/attendance/mark`        | student | Validate QR + mark present         |
| GET    | `/api/attendance/summary`     | student | Overall + subject-wise %           |
| GET    | `/api/attendance/student`     | student | Personal history                   |
| GET    | `/api/attendance/sessions`    | teacher | Recent QR sessions                 |
| GET    | `/api/attendance/history`     | teacher | Records (filter by `classId`)      |

### Timetable
| Method | Endpoint                     | Role    | Description                        |
| ------ | ---------------------------- | ------- | ---------------------------------- |
| GET    | `/api/timetable`             | any     | Weekly timetable (student: own class; teacher: ?classId=) |
| POST   | `/api/timetable`             | teacher | Upsert a slot (class or free)      |
| DELETE | `/api/timetable/:classId/:day/:period` | teacher | Delete slot            |

### Planner
| Method | Endpoint                        | Role    | Description                        |
| ------ | ------------------------------- | ------- | ---------------------------------- |
| GET    | `/api/planner`                  | student | Daily schedule + free periods + plan + tasks |
| GET    | `/api/planner/suggestions`      | student | Personalized activity suggestions  |
| POST   | `/api/planner/tasks/generate`   | student | Create tasks from suggestions      |
| PATCH  | `/api/planner/tasks/:id`        | student | Toggle task completion             |
| DELETE | `/api/planner/tasks/:id`        | student | Delete task                        |

> **Note:** `GET /api/suggestions` (alias from the brief) maps to `GET /api/planner/suggestions`.

### Analytics
| Method | Endpoint                  | Role    | Description                        |
| ------ | ------------------------- | ------- | ---------------------------------- |
| GET    | `/api/analytics/student`  | student | Overall, subject-wise, weekly trend, warnings |
| GET    | `/api/analytics/teacher`  | teacher | Overall, class-wise, subject-wise, daily trend, low-attendance |

---

## 🧪 Testing

The repo ships a full **end-to-end test** that spins up an in-memory MongoDB, seeds demo data, and exercises the entire Teacher → QR → Scan → Analytics flow (39 assertions):

```bash
cd backend
npm run test:e2e
```

It verifies: logins, invalid login, role protection, session creation, valid/invalid/expired QR, duplicate detection, live marks, summaries, timetable + free periods, planner + suggestions, both analytics endpoints, and timetable management.

---

## 🚢 Deployment

### Frontend → Vercel / Netlify
1. Build: `npm run build` (in `frontend/`)
2. Set env var: `VITE_API_URL=https://your-backend.onrender.com/api`
3. Deploy the `dist/` folder.

### Backend → Render
1. Create a Render *Web Service* from `backend/` (Root Directory: `backend`).
2. Build: `npm install`, Start: `npm start`.
3. Set env: `MONGO_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`.

### Database → MongoDB Atlas
1. Create a free cluster → Database User → get the connection string.
2. Use it as `MONGO_URI` (with `retryWrites=true&w=majority`).
3. Whitelist IPs (or `0.0.0.0/0` for a demo).

---

## 🛠️ Environment Variables

| Variable             | Default                                 | Required |
| -------------------- | --------------------------------------- | -------- |
| `MONGO_URI`          | `mongodb://127.0.0.1:27017/smart_curriculum` | yes  |
| `JWT_SECRET`         | (dev only)                              | yes      |
| `JWT_EXPIRES_IN`     | `7d`                                    | no       |
| `PORT`               | `5000`                                  | no       |
| `FRONTEND_URL`       | `http://localhost:5173`                 | no       |
| `QR_SESSION_MINUTES` | `5`                                     | no       |
| `VITE_API_URL`       | (frontend) defaults to Vite proxy       | no       |

---

## 🧹 Error Handling

| Scenario                     | Response                                        |
| ---------------------------- | ----------------------------------------------- |
| Invalid login                | `401 Invalid email or password`                 |
| No / invalid token           | `401 Not authorized`                            |
| Student hitting teacher route| `403 Access denied for this role`               |
| Invalid QR                   | `400 Invalid QR code`                           |
| Expired QR                   | `400 QR session has expired`                    |
| Duplicate attendance         | `409 Attendance already marked for this session`|
| Student not in class         | `403 You are not a student of this class`       |
| Camera permission failure    | Toast + manual-entry fallback in the UI         |
| No free periods              | Friendly empty-state in Free Periods / Planner  |

---

## 🔮 Bonus Features (included)

- ✅ **Dark mode** — toggle in the sidebar (persisted)
- ✅ **Export-ready tables** — history tables are structured for CSV/Excel/PDF export
- ✅ Toast notifications everywhere (success / error / info)

## 📁 Project Layout

```
smart-curriculum-attendance/
├── backend/
│   ├── config/  controllers/  routes/
│   ├── models/  middleware/  services/
│   ├── scripts/ (seedCore, e2e-test, run-memory)
│   ├── app.js   server.js    package.json
├── frontend/
│   ├── src/
│   │   ├── components/  pages/  layouts/
│   │   ├── services/    hooks/  utils/  context/
│   ├── index.html  vite.config.js  package.json
├── database/seed.js
├── .env.example
├── .gitignore
└── README.md
Built for Hackathon 2026 · **Attend. Plan. Learn.** 🎓
 
