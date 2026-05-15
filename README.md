# NotifyBridge

NotifyBridge is an internal announcement and communication platform where authors publish company updates and employees read, acknowledge, and track important announcements with analytics and notifications.

---

# 🚀 Features

## Authentication & Security

* Secure login and registration
* JWT authentication using NextAuth.js
* Role-based access control
* Protected dashboard routes
* Suspended user blocking
* Optional Google OAuth login

---

## Role-Based Access

### EMPLOYEE

Employees can:

* Read published announcements
* Acknowledge announcements
* Receive notifications
* Track unread announcements

### AUTHOR

Authors can:

* Create draft announcements
* Publish announcements
* Archive announcements
* View engagement analytics

---

## Announcement Management

### Draft → Publish Workflow

* New announcements start as drafts
* Drafts are private to authors
* Publishing makes announcements visible to all employees
* Published announcements become immutable
* Archived announcements are hidden from the default feed

---

## Read Tracking

* Opening an announcement automatically marks it as read
* Tracks which employees viewed announcements
* Prevents duplicate read records

---

## Acknowledgment System

* Important announcements can require acknowledgment
* Employees acknowledge announcements with one click
* Tracks acknowledgment status and timestamp

---

## Analytics Dashboard

Authors can view:

* Total reads
* Total acknowledgments
* Pending acknowledgments
* Engagement statistics
* Employee acknowledgment tables

---

## Notifications

* Employees receive notifications for newly published announcements
* Authors receive notifications when employees acknowledge announcements
* Unread notification badges
* Mark as read / delete notifications

---

## Search, Filters & Pagination

* Search announcements by title
* Filter by category
* Unread-only filtering
* Unacknowledged-only filtering
* Sorting and pagination support

---

## Optional AI Assistant

AI assistant can answer:

* unread announcements
* pending acknowledgments
* engagement summaries
* analytics questions

Uses real database data with role-aware responses.

---

# 🛠 Tech Stack

* Next.js 14 App Router
* TypeScript
* PostgreSQL
* Prisma ORM
* TailwindCSS
* shadcn/ui
* NextAuth.js
* JWT Authentication
* React Hook Form
* Zod Validation
* OpenAI API (optional AI assistant)

---

# 📂 Project Structure

```text
src/
  app/
  actions/
  auth/
  components/
  constants/
  hooks/
  lib/
  providers/
  prisma/
  types/
```

---

# ⚡ Getting Started

## 1. Install dependencies

```bash
npm install
```

---

## 2. Setup environment variables

Create `.env` file:

```env
DATABASE_URL="your-postgresql-url"

AUTH_SECRET="your-auth-secret"

AUTH_URL="http://localhost:3000"

AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

JWT_SECRET="your-jwt-secret"

OPENAI_API_KEY=""
```

---

## 3. Push Prisma schema

```bash
npx prisma db push
```

---

## 4. Seed demo data

```bash
npm run db:seed
```

---

## 5. Run development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 👤 Demo Accounts

## AUTHOR

```text
serlaanvesh@gmail.com
Anvesh@1103
```

## EMPLOYEE

```text
 surya@gmail.com
Surya@123
```

---

# 🔐 Security Features

* JWT session authentication
* Middleware route protection
* Role-based authorization
* Protected server actions
* Suspended user blocking
* Server-side validation

---

# 📊 Main Modules

| Module         | Description                         |
| -------------- | ----------------------------------- |
| Authentication | Secure login & role-based access    |
| Announcements  | Create/manage company announcements |
| Read Tracking  | Tracks employee reads               |
| Acknowledgment | Tracks employee acknowledgment      |
| Analytics      | Engagement statistics               |
| Notifications  | In-app alerts                       |
| AI Assistant   | Natural language platform assistant |

---

# 🤖 AI-Assisted Development

This project was developed using AI-assisted engineering workflows with reusable architecture patterns and production-grade best practices.

Skills used:

* frontend-design
* nextjs-app-router-patterns
* prisma-database-setup
* vercel-react-best-practices

---

# 📜 Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:push
npm run db:seed
npm run db:studio
```

---

# 🎯 Hackathon Goal

NotifyBridge helps organizations:

* improve internal communication
* ensure employees read important updates
* track acknowledgment compliance
* monitor engagement analytics efficiently

---

# 📌 Future Improvements

* Real-time notifications
* Advanced AI assistant
* Organization support
* CSV employee import
* AI-powered analytics
* Semantic announcement search

---

# 📄 License

Hackathon Project — NotifyBridge
