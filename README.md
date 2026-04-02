# QuestLog

Gamified attendance tracking system. Turns attendance into an interactive experience with progress maps, leaderboards, challenges, and badges.

## Features

**Students**
- Visual progress map with a candy-themed winding road
- Customizable avatars (DiceBear styles or custom image URL)
- Three challenge types: quizzes, tasks, and streak challenges
- Points, badges, and streak tracking
- Interactive leaderboard with ranking and map views

**Admins**
- Student management (add, edit, delete with confirmation dialogs)
- Date-based attendance marking
- Challenge creation, editing, and archiving
- Task/quiz submission review
- Manual bonus points with audit log

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Auth | JWT (jose) + bcryptjs |
| 3D | Three.js + React Three Fiber |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)

### Setup

```bash
git clone https://github.com/MarkGbla/CF-attendee.git
cd CF-attendee
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

See [`.env.example`](.env.example) for details on each variable.

Push the database schema:

```bash
npm run db:push
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
  app/
    admin/
      (dashboard)/          # Admin dashboard (protected, serves /admin)
      login/                # Admin login
    api/
      admin/                # Login/logout endpoints
      attendance/           # Attendance recording
      challenges/           # Challenge CRUD, submissions, attempts
      leaderboard/          # Leaderboard data
      student/[slug]/       # Student challenges, stats, quiz, task, avatar
      students/             # Student CRUD, points
    leaderboard/            # Public leaderboard (ranking + map views)
    student/[slug]/         # Student progress page
  components/
    admin/                  # Dashboard modals (Add/Edit Student, Challenges, Attendance)
    student/                # Progress map, side quests, avatar picker, 3D background
    ui/                     # Shared (StudentAvatar, ConfirmDialog, Logo)
  lib/
    db/schema.ts            # Drizzle ORM schema
    db/index.ts             # Database connection
    auth.ts                 # JWT + password utilities
    avatar.ts               # DiceBear avatar URL generation
    utils.ts                # Slug generation
  types/index.ts            # TypeScript interfaces
  middleware.ts             # Route protection
```

## How It Works

**Points:** 10 per session attended + challenge rewards + admin bonus points.

**Ranking:** Sorted by total score, then sessions attended, then name.

**Challenges:**
- **Quiz** -- Multiple-choice, auto-graded, all correct to pass
- **Task** -- Submit work for admin review and approval
- **Streak** -- Auto-completes when consecutive attendance target is met

## Deployment

1. Push to GitHub
2. Import on [Vercel](https://vercel.com)
3. Add environment variables (`DATABASE_URL`, `JWT_SECRET`)
4. Deploy

## License

Private project — QuestLog.
