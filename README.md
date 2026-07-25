# Lead Management Application (MERN Stack)

A full-stack Lead Management Application featuring role-based access control (`ADMIN` vs `MEMBER`), HTTP-only JWT authentication, public lead capture landing page, interactive Kanban board and Data Table views, lead assignment, notes system, automated activity logs audit trail, Mongoose pagination & filtering, and automated backend Jest/Supertest test coverage.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`.
- **Testing**: Jest, Supertest, MongoMemoryServer.
- **Frontend**: React, React Router v6, Axios, Tailwind CSS, Lucide React Icons.

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
- Server runs on `http://localhost:5000` by default.
- Automated tests: `npm test`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
- Client runs on `http://localhost:3000` by default.

---

## 📚 API Endpoint Documentation

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`ADMIN` or `MEMBER`). Sets HTTP-only `token` cookie. |
| `POST` | `/api/auth/login` | Public | Authenticate user, returns profile & sets HTTP-only `token` cookie. |
| `POST` | `/api/auth/logout` | Private | Clears the HTTP-only auth cookie. |
| `GET` | `/api/auth/me` | Private | Returns current authenticated user profile. |
| `GET` | `/api/auth/users` | Private | Get list of all users (for lead assignment). |

---

### Public Lead Capture (`/api/leads/public`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leads/public` | Public (No Auth) | Capture lead from landing page form. Creates lead in `NEW` status and auto-generates `LEAD_CREATED` activity log. |

---

### Lead Management (`/api/leads`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leads` | Private | Get paginated & filtered leads. Query params: `page`, `limit`, `status`, `assignedTo`, `search`. (`ADMIN` sees all; `MEMBER` sees assigned only). |
| `POST` | `/api/leads` | Private | Create a new lead manually. |
| `GET` | `/api/leads/:id` | Private | Get lead details, associated notes, and full activity log trail. |
| `PUT` | `/api/leads/:id` | Private | Update lead status, assignment, or details. Triggers automated `STATUS_CHANGE` or `ASSIGNMENT` activity logs. |
| `DELETE` | `/api/leads/:id` | Private (Admin) | Delete a lead and its associated notes & activity logs. |

---

### Notes & Activity Logs

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leads/:id/notes` | Private | Add a note to a lead. Triggers automated `NOTE_ADDED` activity log. |
| `GET` | `/api/leads/:id/activity` | Private | Get chronological activity audit trail for a lead. |

---

## 🧪 Automated Testing

Backend unit and integration test suites cover RBAC security and core lead lifecycle audit logging:

```bash
cd backend
npm test
```

### Test Coverage Summary:
- **Auth & RBAC**: Validates token cookie issuance, enforces 403 Forbidden for Members attempting Admin-only actions (`DELETE /api/leads/:id` or reassignments).
- **Core Lifecycle**: Validates public form capture -> status transition -> note addition -> automatic generation of chronological `ActivityLog` entries.
