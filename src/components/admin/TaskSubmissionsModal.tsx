"use client";

import { useEffect, useState, useCallback } from "react";

interface TaskSub {
  id: number;
  studentId: number;
  studentName: string;
  challengeId: number;
  submissionText: string;
  status: "pending" | "approved" | "rejected";
  grade: number | null;
  adminNotes: string | null;
  pointsSnapshot: number | null;
  submittedAt: string;
  reviewedAt: string | null;
}

interface QuizQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  orderIndex: number;
}

interface QuizAttempt {
  id: number;
  studentId: number;
  studentName: string;
  challengeId: number;
  answers: number[];
  score: number;
  total: number;
  passed: boolean;
  attemptedAt: string;
  pointsEarned: number | null;
}

interface SubmissionsModalProps {
  open: boolean;
  challengeId: number | null;
  challengeType: "quiz" | "task" | "streak" | "poll" | "speedrun" | "checkin" | "wager" | "bounty" | "chain" | "auction" | "duel" | null;
  onClose: () => void;
}

const GRADE_OPTIONS = [
  { value: 100, label: "100%", color: "bg-green-500 hover:bg-green-600 text-white" },
  { value: 80, label: "80%", color: "bg-green-400 hover:bg-green-500 text-white" },
  { value: 70, label: "70%", color: "bg-yellow-400 hover:bg-yellow-500 text-white" },
  { value: 60, label: "60%", color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  { value: 50, label: "50%", color: "bg-orange-400 hover:bg-orange-500 text-white" },
  { value: 0, label: "Fail", color: "bg-red-400 hover:bg-red-500 text-white" },
];

function gradeLabel(grade: number): string {
  if (grade === 0) return "Fail";
  return `${grade}%`;
}

function gradeBadgeClass(grade: number): string {
  if (grade >= 80) return "bg-green-50 text-green-700 border-green-200";
  if (grade >= 60) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (grade >= 50) return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-red-50 text-red-600 border-red-200";
}

export default function TaskSubmissionsModal({
  open,
  challengeId,
  challengeType,
  onClose,
}: SubmissionsModalProps) {
  const [taskSubs, setTaskSubs] = useState<TaskSub[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [pollResults, setPollResults] = useState<{
    totalResponses: number;
    results: { questionText: string; options: { text: string; count: number; percentage: number }[] }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);
  const [pendingIndex, setPendingIndex] = useState(0);

  const fetchData = useCallback(async () => {
    if (!challengeId || !challengeType) return;
    setLoading(true);
    try {
      if (challengeType === "task" || challengeType === "bounty") {
        const res = await fetch(`/api/challenges/${challengeId}/submissions`);
        if (res.ok) setTaskSubs(await res.json());
      } else if (challengeType === "quiz" || challengeType === "wager") {
        const res = await fetch(`/api/challenges/${challengeId}/attempts`);
        if (res.ok) {
          const data = await res.json();
          setQuizQuestions(data.questions);
          setQuizAttempts(data.attempts);
        }
      } else if (challengeType === "poll") {
        const res = await fetch(`/api/challenges/${challengeId}/poll-results`);
        if (res.ok) setPollResults(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [challengeId, challengeType]);

  useEffect(() => {
    if (open && challengeId) {
      setTaskSubs([]);
      setQuizQuestions([]);
      setQuizAttempts([]);
      setPollResults(null);
      setExpandedAttempt(null);
      setPendingIndex(0);
      fetchData();
    }
  }, [open, challengeId, fetchData]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !challengeId) return null;

  async function handleGrade(subId: number, grade: number) {
    setUpdating(subId);
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/submissions/${subId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grade }),
        }
      );
      if (res.ok) {
        const status = grade >= 50 ? "approved" : "rejected";
        setTaskSubs((prev) =>
          prev.map((s) => (s.id === subId ? { ...s, status, grade } : s))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const title =
    challengeType === "quiz"
      ? "Quiz Attempts"
      : challengeType === "wager"
      ? "Wager Attempts"
      : challengeType === "poll"
      ? "Poll Results"
      : challengeType === "bounty"
      ? "Bounty Submissions"
      : "Task Submissions";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 w-full sm:max-w-2xl sm:mx-4 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1A1A1A]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5F0EB] text-[#8B7355] hover:bg-[#E8E0D8] cursor-pointer text-lg transition"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-[#F5F0EB] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* ─── Quiz / Wager Attempts View ─── */}
            {(challengeType === "quiz" || challengeType === "wager") && (
              quizAttempts.length === 0 ? (
                <p className="text-[#8B7355] text-center py-8">
                  No {challengeType === "wager" ? "wager" : "quiz"} attempts yet
                </p>
              ) : (
                <div className="space-y-3">
                  {quizAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="border border-[#E8E0D8] rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedAttempt(
                            expandedAttempt === attempt.id ? null : attempt.id
                          )
                        }
                        className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 hover:bg-[#FDFAF7] transition cursor-pointer text-left gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-[#F5E6D3] flex items-center justify-center text-xs font-bold text-[#8B7355]">
                            {attempt.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-[#1A1A1A] text-sm truncate block">
                              {attempt.studentName}
                            </span>
                            <span className="text-[10px] sm:text-xs text-[#8B7355]">
                              {new Date(attempt.attemptedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-11 sm:ml-0">
                          <span
                            className={`text-sm font-bold ${
                              attempt.passed ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {attempt.score}/{attempt.total}
                          </span>
                          {challengeType === "wager" && attempt.pointsEarned != null && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                                attempt.pointsEarned > 0
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : attempt.pointsEarned < 0
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {attempt.pointsEarned > 0 ? `+${attempt.pointsEarned}` : attempt.pointsEarned} pts
                            </span>
                          )}
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                              attempt.passed
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
                            {attempt.passed ? "Passed" : "Failed"}
                          </span>
                          <span className="text-[#8B7355] text-sm ml-auto sm:ml-0">
                            {expandedAttempt === attempt.id ? "▲" : "▼"}
                          </span>
                        </div>
                      </button>

                      {expandedAttempt === attempt.id && (
                        <div className="border-t border-[#E8E0D8] p-4 bg-[#FDFAF7] space-y-4">
                          {quizQuestions.map((q, qi) => {
                            const studentAnswer = attempt.answers[qi];
                            const isCorrect = studentAnswer === q.correctIndex;
                            return (
                              <div key={q.id}>
                                <p className="text-sm font-semibold text-[#1A1A1A] mb-1.5 flex items-center gap-2">
                                  <span>Q{qi + 1}: {q.questionText}</span>
                                  {isCorrect ? (
                                    <span className="text-green-600 text-xs font-bold">Correct</span>
                                  ) : (
                                    <span className="text-red-500 text-xs font-bold">Wrong</span>
                                  )}
                                </p>
                                <div className="space-y-1 ml-1">
                                  {q.options.map((opt, oi) => {
                                    const isThisCorrect = oi === q.correctIndex;
                                    const isStudentPick = oi === studentAnswer;
                                    const isWrongPick = isStudentPick && !isCorrect;

                                    let bg = "";
                                    let text = "text-[#8B7355]";
                                    let icon = "";

                                    if (isThisCorrect) {
                                      bg = "bg-green-50 border-green-200";
                                      text = "text-green-800 font-medium";
                                      icon = "✓";
                                    } else if (isWrongPick) {
                                      bg = "bg-red-50 border-red-200";
                                      text = "text-red-700 font-medium";
                                      icon = "✗";
                                    } else {
                                      bg = "border-transparent";
                                    }

                                    return (
                                      <div
                                        key={oi}
                                        className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${bg} ${text}`}
                                      >
                                        {icon && (
                                          <span className="w-4 text-center font-bold">{icon}</span>
                                        )}
                                        {!icon && <span className="w-4" />}
                                        <span>{opt}</span>
                                        {isStudentPick && (
                                          <span className="ml-auto text-[10px] text-[#8B7355] font-normal">
                                            student&apos;s answer
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ─── Task Submissions View (one-at-a-time grader) ─── */}
            {(challengeType === "task" || challengeType === "bounty") && (() => {
              if (taskSubs.length === 0) {
                return (
                  <p className="text-[#8B7355] text-center py-8">
                    No submissions yet
                  </p>
                );
              }
              const pending = taskSubs.filter((s) => s.status === "pending");
              const reviewed = taskSubs.filter((s) => s.status !== "pending");
              const reviewedCount = reviewed.length;

              if (pending.length === 0) {
                return (
                  <div>
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-[#1A1A1A] font-semibold">
                        All caught up
                      </p>
                      <p className="text-[#8B7355] text-sm mt-1">
                        Graded {reviewedCount} of {taskSubs.length} submissions
                      </p>
                    </div>
                    {reviewed.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider">Graded</p>
                        {reviewed.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-3 border border-[#E8E0D8] rounded-xl">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 shrink-0 rounded-full bg-[#F5E6D3] flex items-center justify-center text-xs font-bold text-[#8B7355]">
                                {sub.studentName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-[#1A1A1A] truncate">{sub.studentName}</span>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${sub.grade !== null ? gradeBadgeClass(sub.grade) : "bg-[#F5F0EB] text-[#8B7355] border-[#E8E0D8]"}`}>
                              {sub.grade !== null ? gradeLabel(sub.grade) : sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const safeIndex = Math.min(pendingIndex, pending.length - 1);
              const sub = pending[safeIndex];
              return (
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-semibold text-[#8B7355]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingIndex((i) => Math.max(0, i - 1))}
                        disabled={safeIndex === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F5F0EB] text-[#8B7355] hover:bg-[#E8E0D8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                        aria-label="Previous pending submission"
                      >
                        ‹
                      </button>
                      <span>
                        Reviewing {safeIndex + 1} of {pending.length} pending
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingIndex((i) =>
                            Math.min(pending.length - 1, i + 1)
                          )
                        }
                        disabled={safeIndex === pending.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F5F0EB] text-[#8B7355] hover:bg-[#E8E0D8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                        aria-label="Next pending submission"
                      >
                        ›
                      </button>
                    </div>
                    <span>{reviewedCount} of {taskSubs.length} graded</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5F0EB] rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-[#C4A265] transition-all"
                      style={{
                        width: `${(reviewedCount / taskSubs.length) * 100}%`,
                      }}
                    />
                  </div>

                  <div
                    key={sub.id}
                    className="border border-[#E8E0D8] rounded-2xl p-4 animate-slide-up"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-[#F5E6D3] flex items-center justify-center text-sm font-bold text-[#8B7355]">
                        {sub.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#1A1A1A] truncate">
                          {sub.studentName}
                        </div>
                        <div className="text-xs text-[#8B7355]">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#1A1A1A] mb-4 whitespace-pre-wrap bg-[#FDFAF7] p-3 rounded-xl break-all max-h-60 overflow-y-auto">
                      {sub.submissionText}
                    </p>

                    {/* Grade buttons */}
                    <p className="text-xs font-semibold text-[#8B7355] mb-2">Assign Grade</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {GRADE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleGrade(sub.id, opt.value)}
                          disabled={updating === sub.id}
                          className={`px-2 py-2.5 text-sm font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer ${opt.color}`}
                        >
                          {updating === sub.id ? "..." : opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ─── Poll Results View ─── */}
            {challengeType === "poll" && (
              pollResults && pollResults.totalResponses > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#8B7355]">
                    {pollResults.totalResponses} response{pollResults.totalResponses !== 1 ? "s" : ""}
                  </p>
                  {pollResults.results.map((q, qi) => (
                    <div key={qi} className="border border-[#E8E0D8] rounded-xl p-4 space-y-2">
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        Q{qi + 1}: {q.questionText}
                      </p>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-[#8B7355]">
                            <span>{opt.text}</span>
                            <span className="font-semibold">{opt.count} ({opt.percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-[#F5F0EB] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-400 rounded-full transition-all"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#8B7355] text-center py-8">
                  No poll responses yet
                </p>
              )
            )}

            {/* ─── Streak (no submissions) ─── */}
            {(challengeType === "streak" || challengeType === "speedrun" || challengeType === "checkin" || challengeType === "chain" || challengeType === "auction") && (
              <p className="text-[#8B7355] text-center py-8">
                {challengeType === "streak"
                  ? "Streak challenges are auto-completed based on attendance. No submissions to review."
                  : challengeType === "speedrun"
                  ? "Speed run claims are tracked automatically. Students claim slots on their map."
                  : "Check-in responses are tracked automatically. Students tap to check in during the window."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
