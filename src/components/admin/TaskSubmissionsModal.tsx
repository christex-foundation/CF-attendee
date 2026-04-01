"use client";

import { useEffect, useState, useCallback } from "react";

interface TaskSub {
  id: number;
  studentId: number;
  studentName: string;
  challengeId: number;
  submissionText: string;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
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
}

interface SubmissionsModalProps {
  open: boolean;
  challengeId: number | null;
  challengeType: "quiz" | "task" | "streak" | null;
  onClose: () => void;
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!challengeId || !challengeType) return;
    setLoading(true);
    try {
      if (challengeType === "task") {
        const res = await fetch(`/api/challenges/${challengeId}/submissions`);
        if (res.ok) setTaskSubs(await res.json());
      } else if (challengeType === "quiz") {
        const res = await fetch(`/api/challenges/${challengeId}/attempts`);
        if (res.ok) {
          const data = await res.json();
          setQuizQuestions(data.questions);
          setQuizAttempts(data.attempts);
        }
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
      setExpandedAttempt(null);
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

  async function handleReview(subId: number, status: "approved" | "rejected") {
    setUpdating(subId);
    try {
      await fetch(`/api/challenges/${challengeId}/submissions/${subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } finally {
      setUpdating(null);
    }
  }

  const title = challengeType === "quiz" ? "Quiz Attempts" : "Task Submissions";

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
            {/* ─── Quiz Attempts View ─── */}
            {challengeType === "quiz" && (
              quizAttempts.length === 0 ? (
                <p className="text-[#8B7355] text-center py-8">
                  No quiz attempts yet
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

            {/* ─── Task Submissions View ─── */}
            {challengeType === "task" && (
              taskSubs.length === 0 ? (
                <p className="text-[#8B7355] text-center py-8">
                  No submissions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {taskSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="border border-[#E8E0D8] rounded-2xl p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-[#F5E6D3] flex items-center justify-center text-xs font-bold text-[#8B7355]">
                            {sub.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[#1A1A1A] text-sm truncate">
                            {sub.studentName}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border shrink-0 ${
                            sub.status === "approved"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : sub.status === "rejected"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#1A1A1A] mb-3 whitespace-pre-wrap bg-[#FDFAF7] p-3 rounded-xl break-all">
                        {sub.submissionText}
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-xs text-[#8B7355]">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                        {sub.status === "pending" && (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleReview(sub.id, "approved")}
                              disabled={updating === sub.id}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition disabled:opacity-50 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(sub.id, "rejected")}
                              disabled={updating === sub.id}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-red-400 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition disabled:opacity-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ─── Streak (no submissions) ─── */}
            {challengeType === "streak" && (
              <p className="text-[#8B7355] text-center py-8">
                Streak challenges are auto-completed based on attendance. No
                submissions to review.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
