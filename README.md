# Christex Attend

A gamified attendance tracking system built for the Christex Engineering Cohort. Transforms attendance into an engaging experience with progress maps, leaderboards, challenges, badges, and streaks.

## Features

**For Students (Public Access)**
- Personal progress map with a visual winding path showing attendance history
- Three challenge types: quizzes, tasks, and streak challenges
- Points, badges, and streak tracking
- Live leaderboard with rankings and weekly gains
- Auto-generated avatars via DiceBear

**For Admins (Authenticated)**
- Student management (add, edit, delete)
- Bulk attendance marking per session
- Challenge creation and management
- Task submission review and grading
- Manual bonus points with audit logging

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Auth | JWT (jose) + bcryptjs |
| 3D Graphics | Three.js + React Three Fiber |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database

### 1. Clone and install

```bash
git clone https://github.com/your-username/christex-attend.git
cd christex-attend
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secret-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for OpenGraph images |

### 3. Set up the database

```bash
npm run db:generate   # Generate migration files
npm run db:push       # Push schema to database
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

## Project Structure

```
src/
  app/
    admin/
      dashboard/            # Admin dashboard (protected)
      login/                # Admin login page
    api/
      admin/                # Auth endpoints (login, logout)
      attendance/           # Attendance recording
      challenges/           # Challenge CRUD + submissions
      leaderboard/          # Leaderboard data
      student/              # Student challenges, stats, quiz/task
      students/             # Student CRUD + points
    leaderboard/            # Public leaderboard page
    student/[slug]/         # Student progress page
    page.tsx                # Landing page
  components/
    admin/                  # Dashboard modals and forms
    leaderboard/            # Leaderboard 3D background
    student/                # Progress map, nodes, side quests
    ui/                     # Shared components (Logo, Avatar)
  lib/
    db/
      schema.ts             # Database schema (Drizzle ORM)
      index.ts              # Database connection
    auth.ts                 # JWT and password utilities
    avatar.ts               # DiceBear avatar generation
    utils.ts                # Slug generation
  middleware.ts             # Route protection
```

## How It Works

### Points System
- **10 points** per attended session
- **Variable points** for completing challenges
- **Bonus points** awarded manually by admins

### Leaderboard Ranking
1. Total score (descending)
2. Tiebreaker: sessions attended (descending)
3. Final tiebreaker: name (alphabetical)

### Challenge Types
- **Quiz** — Multiple-choice questions, all-or-nothing grading
- **Task** — Free-form submission, requires admin approval
- **Streak** — Auto-completes when a student reaches the required consecutive attendance streak

## Deployment

Deploy to Vercel with one click:

1. Push the repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add the environment variables (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_BASE_URL`)
4. Deploy

## License

This project is private and built for the Christex Engineering Cohort.
