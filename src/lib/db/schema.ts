import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
]);

export const challengeTypeEnum = pgEnum("challenge_type", [
  "quiz",
  "task",
  "streak",
  "poll",
  "speedrun",
  "checkin",
  "wager",
  "bounty",
  "chain",
  "auction",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "draft",
  "active",
  "archived",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  avatarUrl: text("avatar_url"),
  manualPoints: integer("manual_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    sessionNumber: integer("session_number").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    date: timestamp("date").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("attendance_student_session_idx").on(
      table.studentId,
      table.sessionNumber
    ),
  ]
);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: challengeTypeEnum("type").notNull(),
  status: challengeStatusEnum("status").notNull().default("draft"),
  pointsReward: integer("points_reward").notNull().default(0),
  badgeEmoji: varchar("badge_emoji", { length: 10 }),
  badgeName: varchar("badge_name", { length: 100 }),
  anchorSession: integer("anchor_session").notNull(),
  streakRequired: integer("streak_required"),
  speedSlots: integer("speed_slots"),
  checkinWindowSeconds: integer("checkin_window_seconds"),
  checkinActivatedAt: timestamp("checkin_activated_at"),
  wagerMin: integer("wager_min"),
  wagerMax: integer("wager_max"),
  chainRequired: integer("chain_required"),
  auctionMinBid: integer("auction_min_bid"),
  deadline: timestamp("deadline"),
  decayEnabled: boolean("decay_enabled").notNull().default(false),
  decayStartPoints: integer("decay_start_points").notNull().default(40),
  decayPointsPerInterval: integer("decay_points_per_interval").notNull().default(1),
  decayIntervalSeconds: integer("decay_interval_seconds").notNull().default(600),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  options: text("options").notNull(), // JSON array of strings
  correctIndex: integer("correct_index").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const studentChallengeProgress = pgTable(
  "student_challenge_progress",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    pointsEarned: integer("points_earned").notNull().default(0),
    badgeEarned: boolean("badge_earned").notNull().default(false),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("progress_student_challenge_idx").on(
      table.studentId,
      table.challengeId
    ),
  ]
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  answers: text("answers").notNull(), // JSON array of selected indices
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  passed: boolean("passed").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

export const manualPointsLog = pgTable("manual_points_log", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskSubmissions = pgTable("task_submissions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  submissionText: text("submission_text").notNull(),
  status: submissionStatusEnum("status").notNull().default("pending"),
  grade: integer("grade"),
  adminNotes: text("admin_notes"),
  pointsSnapshot: integer("points_snapshot"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const auctionBids = pgTable("auction_bids", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
