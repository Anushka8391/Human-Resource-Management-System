# Human Resource Management System (HRMS)

A basic full-stack HRMS with role-based access.

## Tech Stack
- Frontend: React.js
- Backend: Node.js + Express.js
- Database: MongoDB

## Features
- Authentication (Login/Logout)
- Role-based access (Admin/Employee)
- Employee management (Add/Edit/Delete/List)
- Attendance management (Mark/View)
- Leave management (Apply/Approve/Reject)
- Dashboard summaries (Employees, Leaves, Attendance)
- Responsive UI
- Security hardening (Helmet, login rate limit, stricter CORS)
- Centralized request validation
- Pagination/filter support for listing APIs

## Backend Setup
1. Go to backend folder:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Create `.env` from `.env.example` and update values.
4. Run backend:
   - `npm run dev`

Backend runs on: `http://localhost:5000`

## Frontend Setup
1. Go to frontend folder:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Create `.env` from `.env.example`.
4. Run frontend:
   - `npm start`

Frontend runs on: `http://localhost:3000`

## Default Admin
Admin user is auto-seeded at backend startup from env values:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Default values in sample env:
- `admin@hrms.com`
- `admin123`

## Vercel Deployment (Frontend + Backend)

Deploy frontend and backend as two separate Vercel projects.

### 1) Deploy Backend Project on Vercel
1. In Vercel, click **Add New Project**.
2. Import the same GitHub repository.
3. Set **Root Directory** to `backend`.
4. Vercel uses `backend/vercel.json` and serves Express through `api/index.js`.
5. Add backend environment variables in Vercel Project Settings:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=1d`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `CLIENT_URL` (set this to your frontend Vercel URL once frontend is deployed)
   - `LOGIN_RATE_LIMIT_WINDOW_MS=900000`
   - `LOGIN_RATE_LIMIT_MAX=10`
6. Deploy and copy backend URL (example: `https://hrms-backend.vercel.app`).

### 2) Deploy Frontend Project on Vercel
1. Add another new Vercel project from the same repository.
2. Set **Root Directory** to `frontend`.
3. Add frontend environment variable:
   - `REACT_APP_API_URL=https://<your-backend-domain>/api`
4. Deploy and copy frontend URL (example: `https://hrms-frontend.vercel.app`).

### 3) Final CORS and Redeploy Backend
1. Open backend project env vars.
2. Set `CLIENT_URL` to your frontend URL (or comma-separated list for multiple origins).
   - Example: `https://hrms-frontend.vercel.app,http://localhost:3000`
3. Redeploy backend.

### 4) Authentication and First Login
- There is no public signup route by design.
- First admin is auto-created from backend env (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- Admin creates employees from Employee Management, each with email/password.
- Employee then logs in using that email/password.

### 5) If Admin Login Fails After Env Change
- Existing seeded admin in MongoDB is not overwritten automatically.
- Update/delete old admin user in database, then redeploy backend to reseed.

## Listing API Query Support
The following endpoints now support pagination and filtering:

- `GET /api/employees?page=1&limit=10&search=john&sortBy=createdAt&sortOrder=desc`
- `GET /api/attendance/records?page=1&limit=10&fromDate=2026-05-01&toDate=2026-05-31&status=present`
- `GET /api/leaves?page=1&limit=10&status=pending&fromDate=2026-05-01&toDate=2026-05-31`

Response shape for list APIs:

```json
{
   "data": [],
   "pagination": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
   }
}
```
# Admin access

admin mail = admin@hrms.com
admin pass = admin123