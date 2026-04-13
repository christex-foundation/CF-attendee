"use client";

import { useState, useEffect } from "react";
import { computeDecayedPoints, humanizeInterval } from "@/lib/decay";

interface SideQuestPanelProps {
  open: boolean;
  onClose: () => void;
  studentSlug: string;
  challenge: {
    id: number;
    title: string;
    description: string;
    type: "quiz" | "task" | "streak" | "poll" | "speedrun" | "checkin" | "wager" | "bounty" | "chain" | "auction";
    pointsReward: number;
    badgeEmoji: string | null;
    badgeName: string | null;
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
  };
  completed: boolean;
  pointsEarned: number;
  taskSubmission: { status: "pending" | "approved" | "rejected"; grade: number | null } | null;
  currentStreak: number;
  slotsRemaining?: number;
  checkinWindowOpen?: boolean;
  checkinWindowEndsAt?: string;
  chainProgress?: number;
  highestBid?: number;
  highestBidder?: string;
  studentBid?: number;
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
  poll: { bg: "bg-rose-100", text: "text-rose-700", label: "Poll" },
  speedrun: { bg: "bg-orange-100", text: "text-orange-700", label: "Speed Run" },
  checkin: { bg: "bg-sky-100", text: "text-sky-700", label: "Check-in" },
  wager: { bg: "bg-pink-100", text: "text-pink-700", label: "Wager" },
  bounty: { bg: "bg-lime-100", text: "text-lime-700", label: "Bounty" },
  chain: { bg: "bg-violet-100", text: "text-violet-700", label: "Chain" },
  auction: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Auction" },
};

export default function SideQuestPanel({
  open,
  onClose,
  studentSlug,
  challenge,
  completed,
  pointsEarned,
  taskSubmission,
  currentStreak,
  slotsRemaining,
  checkinWindowOpen,
  checkinWindowEndsAt,
  chainProgress,
  highestBid,
  highestBidder,
  studentBid,
}: SideQuestPanelProps) {
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [taskText, setTaskText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDecayPoints, setCurrentDecayPoints] = useState(0);
  const [speedrunResult, setSpeedrunResult] = useState<{ position: number; gotFullPoints: boolean; pointsEarned: number } | null>(null);
  const [checkinDone, setCheckinDone] = useState(false);
  const [checkinTimeLeft, setCheckinTimeLeft] = useState("");
  const [wagerAmount, setWagerAmount] = useState(0);
  const [wagerData, setWagerData] = useState<{ wagerMin: number; wagerMax: number; currentScore: number } | null>(null);
  const [wagerResult, setWagerResult] = useState<{ passed: boolean; pointsEarned: number; score: number; total: number } | null>(null);
  const [bountyText, setBountyText] = useState("");
  const [bountySubmitted, setBountySubmitted] = useState(false);
  const [chainResult, setChainResult] = useState<{ linkNumber: number; chainComplete: boolean } | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidPlaced, setBidPlaced] = useState(false);
  const [auctionData, setAuctionData] = useState<{ highestBid: number; highestBidder: string; currentScore: number } | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && (challenge.type === "quiz" || challenge.type === "poll") && !completed) {
      const endpoint = challenge.type === "poll" ? "poll" : "quiz";
      fetch(`/api/student/${studentSlug}/challenges/${challenge.id}/${endpoint}`)
        .then((r) => r.json())
        .then((data: QuizQ[]) => {
          setQuestions(data);
          setAnswers(new Array(data.length).fill(-1));
        });
    }
    if (open && challenge.type === "wager" && !completed) {
      fetch(`/api/student/${studentSlug}/challenges/${challenge.id}/wager`)
        .then((r) => r.json())
        .then((data) => {
          setQuestions(data.questions);
          setAnswers(new Array(data.questions.length).fill(-1));
          setWagerData({ wagerMin: data.wagerMin, wagerMax: data.wagerMax, currentScore: data.currentScore });
          setWagerAmount(data.wagerMin);
        });
    }
    if (open && challenge.type === "auction" && !completed) {
      fetch(`/api/student/${studentSlug}/challenges/${challenge.id}/auction`)
        .then((r) => r.json())
        .then((data) => {
          setAuctionData({ highestBid: data.highestBid, highestBidder: data.highestBidder, currentScore: data.currentScore });
          setBidAmount(Math.max(data.auctionMinBid, (data.highestBid || 0) + 1));
        });
    }
    // Reset state when opening
    setResult(null);
    setTaskText("");
    setSubmitted(false);
    setSpeedrunResult(null);
    setCheckinDone(false);
    setWagerResult(null);
    setBountyText("");
    setBountySubmitted(false);
    setChainResult(null);
    setBidPlaced(false);
  }, [open, challenge.id, challenge.type, studentSlug, completed]);

  useEffect(() => {
    if (challenge.type !== "checkin" || !checkinWindowEndsAt || completed) return;
    function tick() {
      const diff = Math.max(0, Math.floor((new Date(checkinWindowEndsAt!).getTime() - Date.now()) / 1000));
      if (diff <= 0) {
        setCheckinTimeLeft("Closed");
        return;
      }
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setCheckinTimeLeft(`${m}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [challenge.type, checkinWindowEndsAt, completed]);

  useEffect(() => {
    if (!challenge.decayEnabled) return;
    function calculate() {
      setCurrentDecayPoints(computeDecayedPoints(challenge));
    }
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [challenge]);

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

  async function submitPoll() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/poll`,
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

  async function claimSpeedrun() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/speedrun`,
        { method: "POST" }
      );
      const data = await res.json();
      setSpeedrunResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function doCheckin() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/checkin`,
        { method: "POST" }
      );
      if (res.ok) setCheckinDone(true);
    } finally {
      setLoading(false);
    }
  }

  async function submitWager() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/wager`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, wagerAmount }),
        }
      );
      const data = await res.json();
      setWagerResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function submitBounty() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/bounty`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionText: bountyText }),
        }
      );
      if (res.ok) setBountySubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  async function joinChain() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/chain`,
        { method: "POST" }
      );
      const data = await res.json();
      setChainResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function placeBid() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/${studentSlug}/challenges/${challenge.id}/auction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: bidAmount }),
        }
      );
      if (res.ok) {
        setBidPlaced(true);
        if (auctionData) {
          setAuctionData({ ...auctionData, highestBid: bidAmount });
        }
      }
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
              {challenge.type !== "poll" && (
                <span className="text-xs text-gray-500 font-medium">
                  +{challenge.decayEnabled ? currentDecayPoints : challenge.pointsReward} points
                  {challenge.decayEnabled && (
                    <span className="text-red-400 ml-1">
                      (−{challenge.decayPointsPerInterval}/{humanizeInterval(challenge.decayIntervalSeconds)})
                    </span>
                  )}
                </span>
              )}
              {challenge.badgeName && (
                <span className="text-xs text-gray-500">
                  {challenge.badgeName}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
          {challenge.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
            /^https?:\/\//.test(part) ? (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                {part}
              </a>
            ) : (
              part
            )
          )}
        </p>

        {challenge.deadline && !completed && (
          <p className="text-xs text-red-500 font-medium mb-5">
            Deadline: {new Date(challenge.deadline).toLocaleString()}
          </p>
        )}

        {!challenge.deadline && <div className="mb-2" />}

        {/* Completed state */}
        {completed && (
          <div className="text-center py-6">
            {challenge.type === "task" && taskSubmission ? (
              taskSubmission.status === "pending" ? (
                <>
                  <div className="text-4xl mb-2">📨</div>
                  <p className="text-lg font-bold text-teal-600">Submitted</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Waiting for admin review.
                  </p>
                </>
              ) : taskSubmission.grade !== null && taskSubmission.grade >= 50 ? (
                <>
                  <div className="text-4xl mb-2">{challenge.badgeEmoji || "✅"}</div>
                  <p className="text-lg font-bold text-green-600">
                    Grade: {taskSubmission.grade}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    +{pointsEarned} points earned
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">❌</div>
                  <p className="text-lg font-bold text-red-500">
                    Failed{taskSubmission.grade !== null ? ` — Grade: ${taskSubmission.grade}%` : ""}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    No points earned on this attempt.
                  </p>
                </>
              )
            ) : pointsEarned > 0 ? (
              <>
                <div className="text-4xl mb-2">{challenge.badgeEmoji || "✅"}</div>
                <p className="text-lg font-bold text-green-600">Completed!</p>
                <p className="text-sm text-gray-500 mt-1">
                  +{pointsEarned} points earned
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">❌</div>
                <p className="text-lg font-bold text-gray-600">Quest closed</p>
                <p className="text-sm text-gray-500 mt-1">
                  No points earned on this attempt.
                </p>
              </>
            )}
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
                    : "Not quite — this quest is now closed."}
                </p>
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
                    Your Submission
                  </label>
                  <textarea
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-800 resize-y"
                    placeholder="Type your answer or paste a link..."
                  />
                  <p className="text-xs text-gray-400">
                    Enter your answer — text, a link, or anything else.
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

        {/* Poll */}
        {challenge.type === "poll" && !completed && (
          <div className="space-y-4">
            {result ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🗳️</div>
                <p className="text-lg font-bold text-rose-600">Thanks for responding!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your response has been recorded.
                </p>
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
                            ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
                <button
                  onClick={submitPoll}
                  disabled={loading || answers.includes(-1)}
                  className="w-full py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit Response"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Speed Run */}
        {challenge.type === "speedrun" && !completed && (
          <div className="space-y-4">
            {speedrunResult ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">{speedrunResult.gotFullPoints ? "🏆" : "😅"}</div>
                <p className={`text-lg font-bold ${speedrunResult.gotFullPoints ? "text-orange-600" : "text-gray-500"}`}>
                  {speedrunResult.gotFullPoints
                    ? `#${speedrunResult.position} — You made it!`
                    : `#${speedrunResult.position} — Too slow!`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  +{speedrunResult.pointsEarned} points earned
                </p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className={`text-sm font-bold ${(slotsRemaining ?? 0) > 0 ? "text-orange-600" : "text-gray-400"}`}>
                    {(slotsRemaining ?? 0) > 0
                      ? `${slotsRemaining} of ${challenge.speedSlots} spots left!`
                      : "All spots taken"}
                  </p>
                </div>
                <button
                  onClick={claimSpeedrun}
                  disabled={loading || (slotsRemaining ?? 0) <= 0}
                  className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Claiming..." : "Claim Reward"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Check-in */}
        {challenge.type === "checkin" && !completed && (
          <div className="space-y-4">
            {checkinDone ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-lg font-bold text-sky-600">Checked in!</p>
                <p className="text-sm text-gray-500 mt-1">
                  +{challenge.pointsReward} points earned
                </p>
              </div>
            ) : checkinWindowOpen ? (
              <>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Window closes in</p>
                  <p className="text-2xl font-bold text-sky-600 tabular-nums">{checkinTimeLeft}</p>
                </div>
                <button
                  onClick={doCheckin}
                  disabled={loading}
                  className="w-full py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Checking in..." : "Check In Now"}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-sm font-semibold text-gray-500">
                  {challenge.checkinActivatedAt && new Date(challenge.checkinActivatedAt) > new Date()
                    ? `Opens ${new Date(challenge.checkinActivatedAt).toLocaleString()}`
                    : challenge.checkinActivatedAt
                    ? "Check-in window has closed"
                    : "Check-in not scheduled yet"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wager */}
        {challenge.type === "wager" && !completed && (
          <div className="space-y-4">
            {wagerResult ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">{wagerResult.passed ? "🎰" : "💸"}</div>
                <p className={`text-lg font-bold ${wagerResult.passed ? "text-pink-600" : "text-gray-500"}`}>
                  {wagerResult.passed
                    ? `You won! +${wagerResult.pointsEarned} points`
                    : `You lost! ${wagerResult.pointsEarned} points`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {wagerResult.score}/{wagerResult.total} correct
                </p>
              </div>
            ) : (
              <>
                {wagerData && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Wager ({wagerData.wagerMin}–{wagerData.wagerMax} pts)
                    </label>
                    <input
                      type="range"
                      min={wagerData.wagerMin}
                      max={Math.max(wagerData.wagerMin, wagerData.wagerMax)}
                      value={wagerAmount}
                      onChange={(e) => setWagerAmount(parseInt(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                    <p className="text-center text-lg font-bold text-pink-600">{wagerAmount} pts</p>
                    <p className="text-xs text-gray-400 text-center">
                      Your score: {wagerData.currentScore} pts
                    </p>
                  </div>
                )}
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
                            ? "border-pink-500 bg-pink-50 text-pink-700 font-medium"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
                <button
                  onClick={submitWager}
                  disabled={loading || answers.includes(-1) || !wagerData || wagerData.wagerMax < wagerData.wagerMin}
                  className="w-full py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Placing wager..." : `Wager ${wagerAmount} pts`}
                </button>
              </>
            )}
          </div>
        )}

        {/* Bounty */}
        {challenge.type === "bounty" && !completed && (
          <div className="space-y-4">
            {bountySubmitted ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">📨</div>
                <p className="text-sm font-semibold text-lime-600">
                  Submitted! First correct answer wins the bounty.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Answer
                  </label>
                  <textarea
                    value={bountyText}
                    onChange={(e) => setBountyText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-gray-800 resize-y"
                    placeholder="Submit your answer to claim the bounty..."
                  />
                </div>
                <button
                  onClick={submitBounty}
                  disabled={loading || !bountyText.trim()}
                  className="w-full py-3 bg-lime-600 text-white font-semibold rounded-lg hover:bg-lime-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit for Bounty"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Chain */}
        {challenge.type === "chain" && !completed && (
          <div className="space-y-4">
            {chainResult ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">{chainResult.chainComplete ? "⛓️‍💥" : "🔗"}</div>
                <p className={`text-lg font-bold ${chainResult.chainComplete ? "text-violet-600" : "text-violet-500"}`}>
                  {chainResult.chainComplete
                    ? "Chain complete! Everyone gets rewarded!"
                    : `You're link #${chainResult.linkNumber}!`}
                </p>
                {!chainResult.chainComplete && (
                  <p className="text-sm text-gray-500 mt-1">
                    {(challenge.chainRequired ?? 2) - chainResult.linkNumber} more needed
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Links filled</span>
                    <span className="font-bold text-violet-600">
                      {chainProgress ?? 0}/{challenge.chainRequired ?? 2}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-violet-400 to-violet-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          ((chainProgress ?? 0) / (challenge.chainRequired ?? 2)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Everyone gets +{challenge.pointsReward} pts when the chain completes!
                  </p>
                </div>
                <button
                  onClick={joinChain}
                  disabled={loading}
                  className="w-full py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Joining..." : "Join Chain"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Auction */}
        {challenge.type === "auction" && !completed && (
          <div className="space-y-4">
            {bidPlaced ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🏷️</div>
                <p className="text-lg font-bold text-yellow-600">Bid placed!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your bid: {bidAmount} pts. Highest bidder wins when the auction ends.
                </p>
              </div>
            ) : (
              <>
                {auctionData && (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-yellow-600 font-medium">Current highest bid</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {auctionData.highestBid > 0 ? `${auctionData.highestBid} pts` : "No bids yet"}
                      </p>
                      {auctionData.highestBidder && (
                        <p className="text-xs text-yellow-600">by {auctionData.highestBidder}</p>
                      )}
                    </div>
                    {(studentBid ?? 0) > 0 && (
                      <p className="text-xs text-center text-gray-500">Your current bid: {studentBid} pts</p>
                    )}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Your bid</label>
                      <input
                        type="number"
                        min={Math.max(challenge.auctionMinBid ?? 1, (auctionData.highestBid || 0) + 1)}
                        max={auctionData.currentScore}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-gray-800"
                      />
                      <p className="text-xs text-gray-400">
                        Your score: {auctionData.currentScore} pts. Winner pays their bid.
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={placeBid}
                  disabled={loading || !auctionData || bidAmount <= (auctionData?.highestBid ?? 0) || bidAmount > (auctionData?.currentScore ?? 0)}
                  className="w-full py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Placing bid..." : `Bid ${bidAmount} pts`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
