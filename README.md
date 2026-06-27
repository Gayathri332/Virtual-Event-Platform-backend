# Virtual Event Management Platform

A backend REST API for managing virtual events, user authentication, and participant management — built with Node.js, TypeScript, Express, and MongoDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB via Mongoose |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Email | Nodemailer (Gmail SMTP) |
| Docs | Swagger UI (OpenAPI 3.0) |
| Tests | Jest + Supertest |

## Project Structure

```
src/
├── config/v1/            # Environment config
├── controllers/v1/       # Business logic
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   └── events.controller.ts
├── db/
│   ├── connection.ts     # MongoDB connection with retry logic
│   └── models/           # Mongoose schemas (User, Event)
├── middlewares/          # entryPoint, exitPoint, auth, roles
├── routes/v1/            # Express routers with Swagger JSDoc
├── services/
│   └── email.service.ts  # Nodemailer — welcome, registration, reminder emails
├── utils/v1/
│   ├── constants.ts      # App-wide enums and collection names
│   └── helpers.ts        # Meet link generator, date/ICS utilities
├── __tests__/            # Jest + Supertest test suites
├── app.ts                # Express app setup
├── server.ts             # Bootstrap: DB connect → server start
└── swagger.ts            # Swagger/OpenAPI setup
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `.env` with your values (see `.env.example` for all keys).

### 3. Run in development
```bash
npm run dev
```

### 4. Run tests
```bash
npm run test
```
> Requires a running MongoDB instance on `localhost:27017`.

### 5. View Swagger UI
```
http://localhost:3000/api-docs
```
Click **Authorize** → paste the `access_token` from `POST /v1/auth/login`.

---

## API Endpoints

### Auth (public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/register` | Register as organizer or attendee |
| POST | `/v1/auth/login` | Login, receive JWT tokens |

### Users (authenticated)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/v1/users/profile` | Any | Get own profile |
| PUT | `/v1/users/profile` | Any | Update own profile |
| POST | `/v1/users/getAll` | Organizer | List users with search + pagination |
| GET | `/v1/users/:id` | Organizer | Get user by ID |
| PUT | `/v1/users/:id` | Organizer | Update user |
| DELETE | `/v1/users/:id` | Organizer | Soft-delete user |

### Events (authenticated)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/v1/events` | Organizer | Create event (auto-generates Meet link) |
| POST | `/v1/events/getAll` | Any | List events with search + pagination |
| GET | `/v1/events/:id` | Any | Get single event |
| PUT | `/v1/events/:id` | Organizer (owner) | Update event |
| DELETE | `/v1/events/:id` | Organizer (owner) | Soft-delete event |
| POST | `/v1/events/:id/register` | Any | Register for event |
| GET | `/v1/events/:id/participants` | Organizer (owner) | View participant list |

---

## Key Features

### Authentication
- JWT access + refresh tokens
- bcrypt password hashing (10 salt rounds)
- Role-based access control: `organizer` and `attendee`

### Event Management
- Full CRUD for events (organizer only)
- Soft deletes — data is never permanently removed
- Organizers can only update/delete their own events

### Auto-generated Google Meet Link
- Every event gets a unique `meet.google.com/xxx-xxxx-xxx` link on creation
- No manual input required from the organizer

### Email Notifications (Nodemailer + Gmail SMTP)
- **Welcome email** on user registration
- **Registration confirmation** with:
  - Event date, start time, end time
  - Google Meet join link + Join Meeting button
  - `.ics` calendar file attachment (works with Google Calendar, Outlook, Apple Calendar)
- **30-minute reminder email** auto-scheduled via `setTimeout` when attendee registers

### Participant Management
- Attendees can register for upcoming events
- Duplicate registration and capacity checks enforced
- Organizers can view full participant list for their events

---

## Auth Flow

```
POST /v1/auth/register  →  create account
POST /v1/auth/login     →  receive { access_token, refresh_token }
Authorization: Bearer <access_token>  →  use on all protected routes
```

## Gmail SMTP Setup

1. Enable 2-Step Verification on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password → copy the 16-character code (no spaces)
4. Set `SMTP_USER=your_gmail@gmail.com` and `SMTP_PASS=<16-char-code>` in `.env`
