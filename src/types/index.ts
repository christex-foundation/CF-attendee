export type AttendanceStatus = "present" | "absent";
export type ChallengeType = "quiz" | "task" | "streak" | "poll" | "speedrun" | "checkin" | "wager" | "bounty" | "chain" | "auction";
export type ChallengeStatus = "draft" | "active" | "archived";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Student {
  id: number;
  name: string;
  slug: string;
  avatarUrl: string | null;
  manualPoints: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  sessionNumber: number;
  status: AttendanceStatus;
  date: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  pointsReward: number;
  badgeEmoji: string | null;
  badgeName: string | null;
  anchorSession: number;
  streakRequired: number | null;
  speedSlots: number | null;
  checkinWindowSeconds: number | null;
  checkinActivatedAt: string | null;
  wagerMin: number | null;
  wagerMax: number | null;
  chainRequired: number | null;
  auctionMinBid: number | null;
  deadline: string | null;
  decayEnabled: boolean;
  decayStartPoints: number;
  decayPointsPerInterval: number;
  decayIntervalSeconds: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: number;
  challengeId: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  orderIndex: number;
}

export interface StudentChallengeProgress {
  id: number;
  studentId: number;
  challengeId: number;
  completed: boolean;
  pointsEarned: number;
  badgeEarned: boolean;
  completedAt: string | null;
}

export interface TaskSubmission {
  id: number;
  studentId: number;
  challengeId: number;
  submissionText: string;
  pointsSnapshot: number;
  status: SubmissionStatus;
  grade: number | null;
  adminNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface SideQuestNode {
  challenge: Challenge;
  progress: StudentChallengeProgress | null;
  taskSubmission: { status: SubmissionStatus; grade: number | null } | null;
  anchorSession: number;
  slotsRemaining?: number;
  checkinWindowOpen?: boolean;
  checkinWindowEndsAt?: string;
  chainProgress?: number;
  highestBid?: number;
  highestBidder?: string;
  studentBid?: number;
}

export interface AttendanceRecordWithStudent extends AttendanceRecord {
  studentName: string;
}
