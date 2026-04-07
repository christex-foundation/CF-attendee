"use client";

import { useState, useEffect } from "react";

interface SideQuestPanelProps {
  open: boolean;
  onClose: () => void;
  studentSlug: string;
  challenge: {
    id: number;
    title: string;
    description: string;
    type: "quiz" | "task" | "streak";
    pointsReward: number;
    badgeEmoji: string | null;
    badgeName: string | null;
    streakRequired: number | null;
    deadline: string | null;
    decayEnabled: boolean;
    decayStartPoints: number;
    decayPointsPerInterval: number;
    createdAt: string;
  };
  completed: boolean;
  currentStreak: number;
}

interface QuizQ {
  id: number;
  questionText: string;
  options: string[];
  orderIndex: number;
}

const typeBadge = {
  quiz: { bg: "bg-purple-100", text: "text-purple-700", label: "Quiz" },
  task: { bg: "bg-teal-100", text: "text-teal-700", label: "Task" },
  streak: { bg: "bg-amber-100", text: "text-amber-700", label: "Streak" },
};

export default function SideQuestPanel({
  open,
  onClose,
  studentSlug,
  challenge,
  completed,
  currentStreak,
}: SideQuestPanelProps) {
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [taskText, setTaskText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDecayPoints, setCurrentDecayPoints] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && challenge.type === "quiz" && !completed) {
      fetch(`/api/student/${studentSlug}/challenges/${challenge.id}/quiz`)
        .then((r) => r.json())
        .then((data: QuizQ[]) => {
          setQuestions(data);
          setAnswers(new Array(data.length).fill(-1));
        });
    }
    // Reset state when opening
    setResult(null);
    setTaskText("");
    setSubmitted(false);
  }, [open, challenge.id, challenge.type, studentSlug, completed]);

  useEffect(() => {
    if (!challenge.decayEnabled) return;
    function calculate() {
      const elapsedSec = Math.floor(
        (Date.now() - new Date(challenge.createdAt).getTime()) / 1000
      );
      const intervals = Math.floor(elapsedSec / 600); // 10-minute windows
      const lost = intervals * challenge.decayPointsPerInterval;
      setCurrentDecayPoints(Math.max(0, challenge.decayStartPoints - lost));
    }
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [challenge.decayEnabled, challenge.decayStartPoints, challenge.decayPointsPerInterval, challenge.createdAt]);

  if (!open) return null;

  const badge = typeBadge[challenge.type];

  async function submitQuiz() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        }
      );
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function submitTask() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/task`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionText: taskText }),
        }
      );
      if (res.ok) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {challenge.badgeEmoji && (
            <span className="text-3xl">{challenge.badgeEmoji}</span>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">
              {challenge.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
              >
                {badge.label}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                +{challenge.decayEnabled ? currentDecayPoints : challenge.pointsReward} points
                {challenge.decayEnabled && (
                  <span className="text-red-400 ml-1">(decaying)</span>
                )}
              </span>
              {challenge.badgeName && (
                <span className="text-xs text-gray-500">
                  {challenge.badgeName}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>

        {challenge.deadline && !completed && (
          <p className="text-xs text-red-500 font-medium mb-5">
            Deadline: {new Date(challenge.deadline).toLocaleString()}
          </p>
        )}

        {!challenge.deadline && <div className="mb-2" />}

        {/* Completed state */}
        {completed && (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">
              {challenge.badgeEmoji || "&#x2705;"}
            </div>
            <p className="text-lg font-bold text-green-600">Completed!</p>
            <p className="text-sm text-gray-500 mt-1">
              +{challenge.pointsReward} points earned
            </p>
          </div>
        )}

        {/* Quiz */}
        {challenge.type === "quiz" && !completed && (
          <div className="space-y-4">
            {result ? (
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-gray-800">
                  {result.score}/{result.total}
                </p>
                <p
                  className={`text-sm font-semibold mt-1 ${
                    result.passed ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {result.passed
                    ? "Passed! Badge earned!"
                    : "Not quite. Try again!"}
                </p>
                {!result.passed && (
                  <button
                    onClick={() => {
                      setResult(null);
                      setAnswers(new Array(questions.length).fill(-1));
                    }}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <>
                {questions.map((q, qi) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      {qi + 1}. {q.questionText}
                    </p>
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => {
                          const updated = [...answers];
                          updated[qi] = oi;
                          setAnswers(updated);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition cursor-pointer ${
                          answers[qi] === oi
                            ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
                <button
                  onClick={submitQuiz}
                  disabled={loading || answers.includes(-1)}
                  className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit Answers"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Task */}
        {challenge.type === "task" && !completed && (
          <div className="space-y-4">
            {submitted ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">&#x1F4E8;</div>
                <p className="text-sm font-semibold text-teal-600">
                  Submitted! Waiting for admin review.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Submission Link
                  </label>
                  <input
                    type="url"
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-800"
                    placeholder="https://github.com/your-repo or drive link..."
                  />
                  <p className="text-xs text-gray-400">
                    Paste a link to your work (GitHub, Google Drive, etc.)
                  </p>
                </div>
                <button
                  onClick={submitTask}
                  disabled={loading || !taskText.trim()}
                  className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit for Review"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Streak */}
        {challenge.type === "streak" && !completed && challenge.streakRequired && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Streak</span>
              <span className="font-bold text-amber-600">
                {currentStreak}/{challenge.streakRequired}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (currentStreak / challenge.streakRequired) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Keep attending to unlock this reward!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
