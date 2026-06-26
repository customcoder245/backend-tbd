# backend-tbd — Complete Handover & API Documentation

**Prepared for:** Successor backend engineer / maintainer  
**Author:** customcoder245  
**Generated:** 2026-06-26

---

## Table of contents
- 1 — Executive summary
- 2 — Goals & audience
- 3 — High-level architecture and data flow
- 4 — Tech stack & dependencies
- 5 — Repository layout and important files
- 6 — Development setup — step-by-step
- 7 — Environment variables (.env.example)
- 8 — Database models — schemas & important fields
- 9 — Authentication & token flows
- 10 — Middlewares and their behavior
- 11 — Routes & endpoints — reference with examples
- 12 — File uploads, storage and exports
- 13 — Background jobs, cron, and long-running tasks
- 14 — Deployment & production checklist (Vercel + alternatives)
- 15 — Observability, logging & error handling
- 16 — Testing, QA & CI recommendations
- 17 — Onboarding checklist (first 24 hours)
- 18 — Troubleshooting guide — common issues & fixes
- 19 — Security checklist
- 20 — Suggested improvements & roadmap

---

## 1 — Executive summary
This repository implements a Node.js + Express backend for an assessment and feedback platform. The API supports:

- Authenticated admin/manager/leader flows for creating/managing assessments, question banks, dashboards, and exports.
- Invitation-based employee flows (tokenized, no-login access) for completing assessments.
- File uploads, email integrations, PDF and Excel exports, and a small scheduled cleanup job.

This document is a practical, step-by-step handover to help a new engineer understand, run, maintain, and improve the project.

---

## 2 — Goals & audience
**Goal:** Enable rapid onboarding and provide the practical knowledge needed to operate and extend the backend.  
**Primary audience:** backend engineers, DevOps, and maintainers.

Assumed knowledge: Node.js, Express, MongoDB, command-line tools, and basic deployment concepts.

---

## 3 — High-level architecture and data flow

### 3.1 Components
- `src/index.js` — entrypoint, loads env, connects to MongoDB, starts server conditionally, schedules cron jobs.
- `src/app.js` — creates Express app, registers global middleware, mounts routes under `/api/v1`.
- `src/controllers/*` — controllers for business logic and request handling.
- `src/models/*` — Mongoose models and schema definitions.
- `src/middlewares/*` — authentication, file handling, invite flows.
- `src/services/*` — integrations (email, cloudinary), PDF/Excel helpers.
- `src/utils/*` — helpers and validators used across controllers.

### 3.2 Typical flows
- Admin flow: Client -> `protect` middleware -> controller validates -> DB operations -> service calls (email/cloudinary) -> response.
- Employee (invite) flow: Client with invite token -> `employeeAccess` middleware -> controller fetches assessment -> submit -> responses saved and invitation marked used.
- Export/PDF flow: Request -> query DB for responses -> generate Excel or render HTML -> Puppeteer produces PDF -> return file or store and return download link.

---

## 4 — Tech stack & dependencies
- Node.js (ES modules) + Express v5
- MongoDB via mongoose
- Authentication: jsonwebtoken (JWT)
- File uploads: multer
- Email: nodemailer / @sendgrid/mail / resend
- Excel/CSV: exceljs, xlsx, csv-parser, json2xls
- PDF: puppeteer + @sparticuz/chromium, pdf-lib
- Image processing & storage: sharp, cloudinary
- Scheduler: node-cron
- Dev tooling: nodemon, eslint

Note: `package.json` sets `"type": "module"` — code uses ESM imports.

---

## 5 — Repository layout and important files

Top-level:
```
package.json
README.md
Dockerfile
public/
src/
  ├─ config/
  ├─ db/
  ├─ controllers/
  ├─ middlewares/
  ├─ models/
  ├─ routes/
  ├─ services/
  ├─ utils/
  ├─ app.js
  └─ index.js
```

Files to inspect first:
- `src/index.js` — server start, cron & DB connect
- `src/app.js` — middleware order, global error handling
- `src/models/user.model.js` — JWT generation and tokens
- `src/middlewares/auth.middleware.js` — protect/flexibleProtect behavior
- `src/controllers/auth.controller.js` — invites, registration, login

---

## 6 — Development setup — step-by-step

1) Prerequisites
- Node >= 18, npm >= 9
- MongoDB (Atlas or local)

2) Clone & install
```bash
git clone https://github.com/customcoder245/backend-tbd.git
cd backend-tbd
cp .env.example .env    # fill required values
npm install
```

3) Development server
```bash
npm run dev    # nodemon -r dotenv/config src/index.js
```

4) Health check
```
GET http://localhost:8000/  -> { success: true, message: "API is working 🚀" }
```

5) Useful scripts
- `npm start` — start server (production-like)
- `npm run dev` — development
- `npm run lint` — run linter

Notes:
- For serverless (Vercel), `src/index.js` avoids calling `listen` when `process.env.VERCEL` is truthy — the app is exported.
- Cron and local cleanup tasks do not run in serverless by default.

---

## 7 — Environment variables (.env.example)

Minimum required values:
```
MONGODB_URL=
JWT_SECRET=
PORT=8000
NODE_ENV=development
```

Optional / provider-specific:
```
FRONTEND_URL=http://localhost:3000
SENDGRID_API_KEY=
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VERCEL=true
```

(See Appendix A in the full handover for an example block you can copy.)

---

## 8 — Database models — schemas & important fields

> Location: `src/models/*.model.js`

### 8.1 User (user.model.js)
- Fields: `email` (unique), `password` (hashed), `role` (enum), `orgName`, `firstName`, `lastName`, `profileImage`, `isEmailVerified`, `emailVerificationToken`, `resetPasswordToken`, `invitationToken`, `profileCompleted`, `notificationPreferences`, `lastAssessmentScore`.
- Methods: `generateAccessToken()` — signs JWT with `JWT_SECRET` (recommended expiry ~3h).

Indexes: `invitationToken`, `emailVerificationToken`, `resetPasswordToken`, and orgName-related indexes.

### 8.2 Invitation (invitation.model.js)
- Fields: `token`, `token1` (alt), `email`, `invitedBy`, `role`, `department`, `orgName`, `used`, `expiredAt`.
- Note: `employeeAccess` middleware checks `token` and `token1`.

### 8.3 Question
- Fields: `text`, `type` (single/multi/scale/text), `options`, `weight`, `domain`, `tags`, `orgName`, `createdBy`.

### 8.4 Assessment & Response
- Assessment stores template, participants, status.  
- Response stores answers array: `{ questionId, value, score }` and snapshot metadata.

Performance: check indexes used for exports and dashboard aggregations — add compound indexes if exports are slow for large orgs.

---

## 9 — Authentication & token flows

### 9.1 JWT Authentication
- Login: `POST /api/v1/auth/login` -> controller returns JWT and user info.
- Protected routes use `Authorization: Bearer <token>`.
- Tokens signed with `JWT_SECRET` — keep secret secure.

### 9.2 Invite-based flows
- `flexibleProtect`: accepts session JWT (Authorization header or cookie) or invite token (`x-invite-token` header or cookie). Sets `req.user` or `req.employee`.
- `employeeAccess`: strict invite-mode; checks `token` or `token1` on Invitation model, verifies `used` and `expiredAt`.
- On submission, controllers should mark `invitation.used = true` where appropriate.

Security tips:
- Avoid passing invite tokens in URLs for long-lived or sensitive flows; prefer headers.
- Implement rate-limiting on auth endpoints.

---

## 10 — Middlewares and their behavior

### `auth.middleware.js`
- `protect(req,res,next)`: verifies `Authorization` header, fetches user, attaches `req.user`.
- `flexibleProtect(req,res,next)`: tries JWT then invite token; attaches `req.user` or `req.employee`.
- `restrictTo(...roles)`: returns middleware ensuring `req.user.role` is in allowed roles.

### `employee.middleware.js` (employeeAccess)
- Accepts token via `x-invite-token`, `req.params.token`, or query param.
- Finds Invitation by `token` or `token1`, checks `used` and `expiredAt`, attaches `req.employee`.

### `multer.middleware.js`
- Disk storage to `os.tmpdir()` (or `/tmp` on Vercel) with file type and size validations.
- Image min size 10KB, max 4MB.
- `excelUpload` has no size limit — careful with large files.

### `csvUpload.middleware.js`
- Parses CSV for bulk invitation import. Controller validates and creates Invitation records.

Operational advice:
- Remove temp files after processing to avoid filling `/tmp`.
- For large files, consider direct upload to cloud storage (S3, Cloudinary) with pre-signed URLs.

---

## 11 — Routes & endpoints — reference with examples

**Base path:** `/api/v1`

### A) Auth & user
- `POST /auth/register` — body `{ email, password, firstName?, lastName?, orgName? }`.
- `POST /auth/login` — body `{ email, password }` -> returns token and user.
- `GET /auth/me` — `flexibleProtect` -> returns user or guest info.
- `POST /auth/send-invitation` — protected -> create invite.
- `POST /auth/send-bulk-invitation` — protected + `multipart/form-data` file upload.

### B) Assessment
- `GET /assessment/start` — returns templates & meta.
- `POST /assessment/start` — protected -> create draft.
- `POST /assessment/:assessmentId/submit` — protected -> finalize submission.
- `GET /assessment/history` — protected -> user's history.

### C) Employee assessment (invite)
- `POST /employee-assessment/start` — header `x-invite-token: <token>` -> returns assessment instance and questions.
- `POST /employee-assessment/:assessmentId/submit/:token` — submit answers; mark invite used.

### D) Questions
- `GET /questions/all` — protected -> list org questions.
- `POST /questions/upload` — `excelUpload.single('file')` -> import questions in bulk.

### E) Responses & Exports
- `POST /responses` — `flexibleProtect` -> save/update responses.
- `GET /responses/:assessmentId/export` — `flexibleProtect` -> download Excel.
- `GET /responses/organization/:orgName/export` -> org-level export.

### F) Dashboard & PDF
- `GET /dashboard/export-pdf` — protected -> triggers Puppeteer-based PDF generation.
- `GET /dashboard/preview-pdf-report` — returns HTML preview.

> Example curl (login):
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123"}'
```

---

## 12 — File uploads, storage and exports

- Uploads: use Multer with disk storage; temporary files under `os.tmpdir()` or `/tmp`.
- After processing, move files to Cloudinary or S3 and delete temp files.
- Excel generation: use `exceljs`/`xlsx` and stream large exports.
- PDF generation: use Puppeteer + `@sparticuz/chromium` for serverless compatibility. Prefer running heavy exports in background workers.

Performance tips:
- Stream large exports directly to the response or to cloud storage.
- Use job queues (BullMQ, Redis) for expensive exports.

---

## 13 — Background jobs, cron, and long-running tasks

- `src/index.js` schedules a cron (`* * * * *`) to delete expired/unverified users every minute (runs only when index.js executes).
- `index.js` contains a local-only index-drop (invitationId_1) — review/remove before running in production.

Recommendation: move cron and heavy jobs into a worker process and use a reliable queue (Redis + BullMQ).

---

## 14 — Deployment & production checklist

### Vercel (serverless)
- Set `VERCEL=true` so `index.js` does not call `listen`.
- Ensure Puppeteer runs with `@sparticuz/chromium` and test PDF endpoints.
- Use `/tmp` for temporary files and clean them up.
- Move scheduled tasks to an external scheduler.

### Docker/container
- Build an image with Node; run `node src/index.js` with environment variables.
- Run separate worker containers for cron and heavy exports.

Security & infra:
- Store secrets in environment variables (Vercel secrets, AWS Secrets Manager, etc.).
- Restrict MongoDB network access via allowlist.

---

## 15 — Observability, logging & error handling

- Implement structured logging (pino/winston) with timestamps and request ids.
- Centralize error handling middleware in `src/app.js`.
- Capture `unhandledRejection` and `uncaughtException` to log and exit gracefully.
- Add APM and monitoring for export endpoints (Sentry/Datadog/NewRelic).

---

## 16 — Testing, QA & CI recommendations

- Unit tests: Jest for utilities and model methods.
- Integration tests: Supertest for endpoints (auth, invite, submit, export).
- CI: GitHub Actions to run `npm ci`, `npm run lint`, `npm test` on pull requests.
- Use an in-memory MongoDB (mongodb-memory-server) or a dedicated test DB for CI.

---

## 17 — Onboarding checklist (first 24 hours)
1. Clone repo and install dependencies.
2. Create `.env` from `.env.example` and run `npm run dev`.
3. Register a test admin and validate login and protected endpoints.
4. Create and accept an invitation; run the employee assessment flow end-to-end.
5. Upload sample Excel for bulk invites and validate parsing.
6. Generate a small export (Excel or PDF) to validate export flow.
7. Run linter and tests locally.

---

## 18 — Troubleshooting guide — common issues & fixes

### MongoDB connection errors
- Verify `MONGODB_URL`, network access, and DNS.
- For SRV records, ensure correct connection string format and DNS.

### Invalid/expired tokens
- Confirm `JWT_SECRET` matches the one used to sign tokens.
- Re-login to get a new token.

### Invitation not found or token invalid
- Ensure token is looked up in `token` or `token1` fields.
- Check `Invitation.used` and `expiredAt`.

### File upload issues (Vercel)
- Confirm temp files are written to `/tmp` and cleaned up.
- Check size/mime type limits.

### PDF fails to open / broken PDF
- If preview shows "Failed to load PDF document", the file may be corrupted or a non-PDF was saved with `.pdf` extension.
- Re-generate binary PDF using Puppeteer and verify first 4 bytes are `%PDF`.

---

## 19 — Security checklist
- Do not commit secrets to the repo.
- Enforce strong validation on auth endpoints.
- Add rate-limiting (express-rate-limit) for auth routes.
- Use HTTPS and secure, httpOnly cookies for tokens.
- Audit npm dependencies (`npm audit`) and update critical vulnerabilities.

---

## 20 — Suggested improvements & roadmap

**Immediate (high priority)**
- Add `.env.example` and `docs/API.md` in repo.
- Create Postman collection and include in `/docs`.
- Add request validation (Joi/express-validator) and rate limiting.
- Move heavy exports to a job queue system.
- Add unit/integration tests and CI.

**Near-term**
- Add OpenAPI/Swagger documentation for endpoints.
- Add monitoring and centralized logs for exports.

**Long-term**
- Consider multi-tenant hardening where orgs require stronger isolation.
- Implement refresh token flow and token revocation.

---

### Appendix A — Example `.env.example`
```
MONGODB_URL=
JWT_SECRET=
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SENDGRID_API_KEY=
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VERCEL=true
```

### Appendix B — Example requests (curl)
**Login**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123"}'
```

**Employee start (invite)**
```bash
curl -X POST "http://localhost:8000/api/v1/employee-assessment/start" \
  -H "x-invite-token: <INVITE_TOKEN>"
```

### Appendix C — Postman collection (recommended structure)
- Folder: Auth (register, login, me)
- Folder: Invitations (send-invitation, send-bulk-invitation)
- Folder: Assessments (start, submit, history)
- Folder: Responses (save, export)
- Environments: local (baseUrl), variables: ADMIN_TOKEN, INVITE_TOKEN

---

## How to download or convert this report to PDF
You can download and convert the Markdown to PDF either via GitHub UI or locally:

1) From GitHub (quick):
- View this file: https://github.com/customcoder245/backend-tbd/blob/main/docs/handover.md
- Click **Raw** -> Save the page (Ctrl+S) or print (Ctrl+P) and select "Save as PDF".

2) Convert locally with Pandoc (recommended for best formatting):
```bash
# install pandoc if needed
pandoc docs/handover.md -o handover.pdf --pdf-engine=xelatex -V geometry:margin=1in
```

3) Use VS Code or other editor: open `docs/handover.md` -> Print to PDF.

---

**Committed to:** `docs/handover.md` in this repository.  
If you want a professionally typeset PDF (cover page, TOC with page numbers, headers/footers), reply "Generate PDF" and I will produce and attach a PDF file.

End of document.
