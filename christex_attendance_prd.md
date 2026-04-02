# QuestLog - Product Requirements Document

## 1. Overview

QuestLog is a gamified attendance tracking system. It transforms mundane attendance tracking into an engaging, game-like experience where students progress through a visual map, earn points, complete challenges, collect badges, and compete on a live leaderboard. Only admins can manage the system; students interact through public, personalized pages.

---

## 2. Problem Statement

Traditional attendance tracking is passive and uninspiring. Students have no incentive to maintain consistency, and there is no visibility into attendance trends or engagement. This leads to declining participation over time, especially in cohort-based learning programs.

---

## 3. Goals & Objectives

| Goal | Description |
|------|-------------|
| Engagement | Make attendance feel rewarding through gamification (points, streaks, badges, challenges) |
| Visibility | Give students a visual, real-time view of their progress and ranking |
| Simplicity | Zero friction for students (no login required); admin-only authentication |
| Motivation | Drive consistency through competitive leaderboards and streak tracking |
| Accountability | Provide admins with clear tools to track and manage cohort attendance |

---

## 4. Users & Roles

### 4.1 Admin (Authenticated)
- Logs in with email and password
- Full control over student management, attendance, challenges, and points
- Can review and grade task submissions

### 4.2 Student (Public Access)
- Accesses their personal progress page via a unique URL (e.g., `/student/john-doe-a3f2`)
- Views the leaderboard
- Completes challenges (quizzes, tasks)
- No login or authentication required

---

## 5. Feature Specification

### 5.1 Authentication & Authorization

| Requirement | Detail |
|-------------|--------|
| Login | Email + password authentication |
| Password Security | bcryptjs hashing (12 rounds) |
| Session Management | JWT with 7-day expiry, stored in httpOnly cookie |
| Route Protection | Middleware guards admin dashboard and management API routes |
| Cookie Flags | httpOnly, secure (production), sameSite: lax |

**Protected Routes:**
- `/admin/dashboard/*`
- `/api/students/*`
- `/api/attendance/*`
- `/api/challenges/*`

---

### 5.2 Student Management

| Feature | Detail |
|---------|--------|
| Create Student | Admin enters name; system generates unique slug (name + random hex) |
| Edit Student | Admin can update student name |
| Delete Student | Cascade deletes all related attendance and challenge records |
| Copy Link | Admin can copy a student's unique public URL to share |
| Manual Points | Admin can award bonus points with a reason (logged for audit) |
| Avatars | Auto-generated using DiceBear Adventurer theme, derived from student slug |

---

### 5.3 Attendance Tracking

| Feature | Detail |
|---------|--------|
| Session-Based | Attendance is recorded per numbered session |
| Statuses | Present or Absent |
| Bulk Recording | Admin marks all students for a session in one action |
| Upsert Logic | Re-marking a session updates the existing record (no duplicates) |
| Unique Constraint | One record per student per session enforced at database level |

---

### 5.4 Gamification System

#### 5.4.1 Points

| Source | Points |
|--------|--------|
| Attendance | 10 points per present session |
| Challenge Completion | Variable (set per challenge by admin) |
| Manual Bonus | Admin-awarded, with logged reason |

**Total Score Formula:**
```
totalScore = (sessionsPresent x 10) + challengePoints + manualPoints
```

#### 5.4.2 Streaks

- Calculated as the maximum number of consecutive "present" sessions
- Resets on any "absent" session
- Displayed on student profile and leaderboard
- Can trigger automatic completion of streak-type challenges

#### 5.4.3 Badges

- Awarded upon challenge completion
- Each badge has an emoji icon and a name (e.g., "Early Bird")
- Displayed on student profile stats
- Badge count contributes to student profile richness

#### 5.4.4 Weekly Gains

- Calculated as points earned since the start of the current week (Monday)
- Displayed on the leaderboard to highlight recent momentum

---

### 5.5 Challenge System

Three distinct challenge types:

#### Quiz Challenge
| Aspect | Detail |
|--------|--------|
| Format | Multiple-choice questions |
| Grading | All-or-nothing (100% required to pass) |
| Completion | One-time; auto-updates progress on pass |
| Structure | Question text, options array, correct index |

#### Task Challenge
| Aspect | Detail |
|--------|--------|
| Format | Free-form text submission |
| Grading | Manual admin review (approve/reject with notes) |
| Completion | Marked complete only on admin approval |
| Workflow | Student submits -> Admin reviews -> Approved/Rejected |

#### Streak Challenge
| Aspect | Detail |
|--------|--------|
| Format | Automatic; requires reaching a streak threshold |
| Grading | Auto-completes when student's max streak meets requirement |
| Trigger | Checked on student page load via server action |

**Challenge Properties:**
- Title, description, type, status (draft/active/archived)
- Points reward, badge emoji, badge name
- Anchor session (determines position on the progress map)
- Streak requirement (for streak type only)

---

### 5.6 Leaderboard

| Feature | Detail |
|---------|--------|
| Ranking | Sorted by total score (descending) |
| Tiebreaker #1 | Sessions present (descending) |
| Tiebreaker #2 | Name (alphabetical, ascending) |
| Visual | Interactive SVG map with students positioned along a winding road |
| Avatars | DiceBear-generated avatars displayed per student |
| Tooltips | Hover to see score breakdown (attendance, challenges, bonus) |
| Weekly Gains | Shows points earned this week |
| Access Control | Students must verify identity (select name) before accessing individual profiles |
| Animation | 3D particle background via Three.js |

---

### 5.7 Student Progress Map

| Feature | Detail |
|---------|--------|
| Layout | Vertical winding path with session nodes |
| Node States | Green (present), Red (absent), Gray/locked (future) |
| Side Quests | Challenges anchored to specific sessions appear as branching nodes |
| Decorations | Candy-themed elements (lollipops, candy canes, stars, sparkles) |
| Stats Bar | Total points, badge count, current streak |
| Progress Bar | Percentage of sessions attended |
| Background | 3D animated particles (Three.js, client-side only) |
| Interactions | Click side quest nodes to open challenge panels (quiz/task submission) |

---

### 5.8 Admin Dashboard

| Feature | Detail |
|---------|--------|
| Layout | Sidebar navigation + main content area |
| Tabs | Students, Challenges |
| Summary Cards | Total students, total sessions, active challenges |
| Student Table | Name, attendance count, points, actions (edit, delete, mark attendance, copy link, add points) |
| Challenge Table | Title, type, status, points, badge, actions (edit, delete, view submissions) |
| Modals | Add student, edit student, mark attendance, create challenge, review submissions, add points |

---

## 6. Data Model

### 6.1 Entity Relationship

```
admins
  id (PK, serial)
  email (varchar 255, unique)
  passwordHash (text)
  createdAt (timestamp)

students
  id (PK, serial)
  name (varchar 255)
  slug (varchar 255, unique)
  manualPoints (integer, default 0)
  createdAt (timestamp)

attendance
  id (PK, serial)
  studentId (FK -> students)
  sessionNumber (integer)
  status (enum: present | absent)
  date (timestamp)
  UNIQUE(studentId, sessionNumber)

challenges
  id (PK, serial)
  title (varchar 255)
  description (text)
  type (enum: quiz | task | streak)
  status (enum: draft | active | archived)
  pointsReward (integer, default 0)
  badgeEmoji (varchar 10, nullable)
  badgeName (varchar 100, nullable)
  anchorSession (integer)
  streakRequired (integer, nullable)
  createdAt (timestamp)

quizQuestions
  id (PK, serial)
  challengeId (FK -> challenges)
  questionText (text)
  options (text, JSON array)
  correctIndex (integer)
  orderIndex (integer)

studentChallengeProgress
  id (PK, serial)
  studentId (FK -> students)
  challengeId (FK -> challenges)
  completed (boolean, default false)
  pointsEarned (integer, default 0)
  badgeEarned (boolean, default false)
  completedAt (timestamp, nullable)
  createdAt (timestamp)
  UNIQUE(studentId, challengeId)

quizAttempts
  id (PK, serial)
  studentId (FK -> students)
  challengeId (FK -> challenges)
  answers (text, JSON array)
  score (integer)
  total (integer)
  passed (boolean)
  attemptedAt (timestamp)

taskSubmissions
  id (PK, serial)
  studentId (FK -> students)
  challengeId (FK -> challenges)
  submissionText (text)
  status (enum: pending | approved | rejected)
  adminNotes (text, nullable)
  submittedAt (timestamp)
  reviewedAt (timestamp, nullable)

manualPointsLog
  id (PK, serial)
  studentId (FK -> students)
  points (integer)
  reason (text, nullable)
  createdAt (timestamp)
```

---

## 7. API Specification

### 7.1 Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Authenticate admin, returns JWT cookie |
| GET | `/api/leaderboard` | Full leaderboard with rankings and scores |
| GET | `/api/student/[slug]/challenges` | Active challenges for a student |
| GET | `/api/student/[slug]/stats` | Student points, badges, streak |
| POST | `/api/student/[slug]/challenges/[id]/quiz` | Submit quiz answers |
| POST | `/api/student/[slug]/challenges/[id]/task` | Submit task response |

### 7.2 Protected Endpoints (Admin Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/logout` | Clear auth cookie |
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create new student |
| PUT | `/api/students/[id]` | Update student name |
| DELETE | `/api/students/[id]` | Delete student (cascade) |
| POST | `/api/students/[id]/points` | Award manual points |
| GET | `/api/students/[id]/points` | Get manual points balance |
| POST | `/api/attendance` | Bulk record attendance for a session |
| GET | `/api/challenges` | List all challenges |
| POST | `/api/challenges` | Create new challenge |
| GET | `/api/challenges/[id]` | Get challenge with questions |
| PUT | `/api/challenges/[id]` | Update challenge |
| DELETE | `/api/challenges/[id]` | Delete challenge |
| GET | `/api/challenges/[id]/attempts` | View quiz attempts |
| GET | `/api/challenges/[id]/submissions` | View task submissions |
| PUT | `/api/challenges/[id]/submissions/[subId]` | Grade a task submission |

---

## 8. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL (Neon Serverless) | - |
| ORM | Drizzle ORM | 0.45.1 |
| Auth | JWT (jose) + bcryptjs | jose 6.2.2 |
| 3D Graphics | Three.js + React Three Fiber | three 0.183.2 |
| Avatars | DiceBear API (Adventurer theme) | - |
| Deployment | Vercel | - |

---

## 9. Architecture

### 9.1 Frontend Architecture
- **Server Components** for data fetching (leaderboard page, student page)
- **Client Components** for interactivity (maps, modals, forms, 3D backgrounds)
- **Dynamic imports** with `ssr: false` for Three.js components
- **Path alias** `@/*` mapped to `./src/*`

### 9.2 Backend Architecture
- **API Routes** for CRUD operations and data endpoints
- **Server Actions** for streak challenge auto-completion
- **Middleware** for JWT-based route protection
- **Drizzle ORM** for type-safe database queries

### 9.3 Security Architecture
- Password hashing with bcryptjs (12 rounds)
- JWT tokens with 7-day expiry
- httpOnly, secure, sameSite cookies
- Middleware-level route protection
- No student authentication required (public access by design)

---

## 10. Design System

### 10.1 Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Brand / Gold | Gold | `#C4A265` |
| Background (Dark) | Near Black | `#0A0A0A` |
| Surface (Dark) | Dark Gray | `#1A1A1A` |
| Border | Subtle Gray | `#2A2A2A` |
| Success / Present | Green | `#4ADE80` |
| Challenge / Accent | Purple | `#A78BFA` |
| Rank / Gold | Bright Gold | `#FFD700` |
| Warning / Accent | Orange | `#FF8C00` |

### 10.2 Typography
- **Font:** Inter (Google Fonts)
- **Style:** Clean sans-serif, large readable text
- **Approach:** Mobile-first responsive sizing

### 10.3 Animations

| Animation | Purpose |
|-----------|---------|
| `pulse-glow` | Golden glow on featured elements |
| `bounce-node` | Bouncing effect for rank #1 |
| `sparkle` | Twinkling star decorations |
| `float-candy` | Floating candy-themed decorations |
| `road-dash` | Animated dashed road path |
| `badge-earned` | Badge pop-in animation |
| `streak-fire` | Flickering fire effect for streaks |

### 10.4 Theme
- Dark mode for all student-facing pages
- Clean, minimal admin interface
- Candy/game-themed visual elements on progress maps
- 3D particle backgrounds for immersive feel

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page Load | < 2 seconds |
| Responsiveness | Mobile-first, fully responsive |
| Browser Support | Modern browsers (Chrome, Firefox, Safari, Edge) |
| Accessibility | Readable fonts, sufficient color contrast |
| Scalability | Supports cohort sizes of 50-100 students |
| Availability | Deployed on Vercel with automatic scaling |
| Data Integrity | Unique constraints, foreign keys, cascade deletes |

---

## 12. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `NODE_ENV` | Yes | `development` or `production` |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for OpenGraph images |

---

## 13. Project Structure

```
src/
  app/
    admin/
      dashboard/          # Protected admin dashboard
      login/              # Admin login page
    api/
      admin/              # Login, logout endpoints
      attendance/         # Attendance recording
      challenges/         # Challenge CRUD + submissions
      leaderboard/        # Leaderboard data
      student/            # Student challenges, stats, quiz/task submission
      students/           # Student CRUD + points
    leaderboard/          # Public leaderboard page
    student/[slug]/       # Individual student progress page
    page.tsx              # Landing page
    layout.tsx            # Root layout with metadata
    globals.css           # Global styles + animations
  components/
    admin/                # Dashboard modals and forms (7 components)
    leaderboard/          # 3D background for leaderboard
    student/              # Progress map, nodes, side quests, stats (6 components)
    ui/                   # Shared UI (Logo, StudentAvatar)
  lib/
    db/
      schema.ts           # Drizzle ORM schema definitions
      index.ts            # Database connection
    auth.ts               # JWT + password utilities
    avatar.ts             # DiceBear avatar URL generation
    utils.ts              # Slug generation
  middleware.ts           # Route protection middleware
```

---

## 14. Current Status

### Implemented
- Admin authentication (login/logout)
- Student CRUD management
- Session-based attendance tracking with bulk recording
- Gamified leaderboard with rankings, scores, and weekly gains
- Student progress map with visual attendance history
- Three challenge types (quiz, task, streak) with full lifecycle
- Points system (attendance + challenges + manual bonus)
- Badge system with emoji icons
- Streak tracking and auto-completion
- DiceBear auto-generated avatars
- 3D animated backgrounds (Three.js)
- Responsive mobile-first design
- Custom branding and OpenGraph social preview
- Middleware-based route protection

### Future Enhancements
- Push notifications for new challenges or streak milestones
- Email reminders for attendance
- Export attendance data (CSV/PDF)
- Student-to-student messaging or reactions
- Achievement tiers (Bronze, Silver, Gold)
- Admin analytics dashboard with charts
- Multi-cohort support
- Dark/light theme toggle
