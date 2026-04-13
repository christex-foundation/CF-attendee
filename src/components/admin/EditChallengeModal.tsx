"use client";

import { useState, useEffect, useCallback } from "react";
import type { Challenge } from "@/types";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { splitInterval, toSeconds } from "@/lib/decay";

interface QuestionInput {
  questionText: string;
  options: string[];
  correctIndex: number;
}

interface EditChallengeModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  challenge: Challenge | null;
}

export default function EditChallengeModal({
  open,
  onClose,
  onUpdated,
  challenge,
}: EditChallengeModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"quiz" | "task" | "streak" | "poll" | "speedrun" | "checkin" | "wager" | "bounty" | "chain" | "auction">("quiz");
  const [pointsReward, setPointsReward] = useState(10);
  const [badgeEmoji, setBadgeEmoji] = useState("");
  const [badgeName, setBadgeName] = useState("");
  const [anchorSession, setAnchorSession] = useState(1);
  const [streakRequired, setStreakRequired] = useState(3);
  const [speedSlots, setSpeedSlots] = useState(5);
  const [checkinWindowMinutes, setCheckinWindowMinutes] = useState(5);
  const [checkinScheduledAt, setCheckinScheduledAt] = useState("");
  const [wagerMin, setWagerMin] = useState(5);
  const [wagerMax, setWagerMax] = useState(50);
  const [chainRequired, setChainRequired] = useState(5);
  const [auctionMinBid, setAuctionMinBid] = useState(10);
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [isTimeBound, setIsTimeBound] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [decayEnabled, setDecayEnabled] = useState(false);
  const [decayStartPoints, setDecayStartPoints] = useState(40);
  const [decayPointsPerInterval, setDecayPointsPerInterval] = useState(1);
  const [decayIntervalValue, setDecayIntervalValue] = useState(10);
  const [decayIntervalUnit, setDecayIntervalUnit] = useState<"seconds" | "minutes" | "hours">("minutes");
  const [loading, setLoading] = useState(false);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !challenge) return;
    setTitle(challenge.title);
    setDescription(challenge.description);
    setType(challenge.type);
    setPointsReward(challenge.pointsReward);
    setBadgeEmoji(challenge.badgeEmoji || "");
    setBadgeName(challenge.badgeName || "");
    setAnchorSession(challenge.anchorSession);
    setStreakRequired(challenge.streakRequired || 3);
    setSpeedSlots(challenge.speedSlots || 5);
    setCheckinWindowMinutes(challenge.checkinWindowSeconds ? Math.round(challenge.checkinWindowSeconds / 60) : 5);
    setCheckinScheduledAt(challenge.checkinActivatedAt ? new Date(challenge.checkinActivatedAt).toISOString().slice(0, 16) : "");
    setWagerMin(challenge.wagerMin || 5);
    setWagerMax(challenge.wagerMax || 50);
    setChainRequired(challenge.chainRequired || 5);
    setAuctionMinBid(challenge.auctionMinBid || 10);
    setIsTimeBound(!!challenge.deadline);
    setDeadline(challenge.deadline ? new Date(challenge.deadline).toISOString().slice(0, 16) : "");
    setDecayEnabled(challenge.decayEnabled ?? false);
    setDecayStartPoints(challenge.decayStartPoints ?? 40);
    setDecayPointsPerInterval(challenge.decayPointsPerInterval ?? 1);
    {
      const split = splitInterval(challenge.decayIntervalSeconds ?? 600);
      setDecayIntervalValue(split.value);
      setDecayIntervalUnit(split.unit);
    }
    setError("");

    if (challenge.type === "quiz" || challenge.type === "poll" || challenge.type === "wager") {
      setFetchingQuestions(true);
      fetch(`/api/challenges/${challenge.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.questions) {
            setQuestions(
              data.questions.map((q: { questionText: string; options: string; correctIndex: number }) => ({
                questionText: q.questionText,
                options: JSON.parse(q.options),
                correctIndex: q.correctIndex,
              }))
            );
          }
        })
        .catch(() => setError("Failed to load questions"))
        .finally(() => setFetchingQuestions(false));
    } else {
      setQuestions([]);
    }
  }, [open, challenge]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  if (!open || !challenge) return null;

  function addQuestion() {
    setQuestions([
      ...questions,
      { questionText: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  }

  function removeQuestion(index: number) {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  }

  function updateQuestion(index: number, field: string, value: string | number) {
    const updated = [...questions];
    if (field === "questionText") {
      updated[index].questionText = value as string;
    } else if (field === "correctIndex") {
      updated[index].correctIndex = value as number;
    }
    setQuestions(updated);
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        title,
        description,
        pointsReward,
        badgeEmoji: badgeEmoji || null,
        badgeName: badgeName || null,
        anchorSession,
      };

      if (type === "streak") {
        body.streakRequired = streakRequired;
      }

      if (type === "speedrun") {
        body.speedSlots = speedSlots;
      }

      if (type === "checkin") {
        body.checkinWindowSeconds = checkinWindowMinutes * 60;
        body.checkinActivatedAt = checkinScheduledAt ? new Date(checkinScheduledAt).toISOString() : null;
      }

      if (type === "quiz" || type === "wager") {
        body.questions = questions;
      }

      if (type === "poll") {
        body.questions = questions.map((q) => ({ ...q, correctIndex: -1 }));
      }

      if (type === "wager") {
        body.wagerMin = wagerMin;
        body.wagerMax = wagerMax;
      }

      if (type === "chain") {
        body.chainRequired = chainRequired;
      }

      if (type === "auction") {
        body.auctionMinBid = auctionMinBid;
      }

      body.deadline = isTimeBound && deadline ? new Date(deadline).toISOString() : null;
      body.decayEnabled = decayEnabled;
      if (decayEnabled) {
        body.decayStartPoints = decayStartPoints;
        body.decayPointsPerInterval = decayPointsPerInterval;
        body.decayIntervalSeconds = toSeconds(decayIntervalValue, decayIntervalUnit);
      }

      const res = await fetch(`/api/challenges/${challenge!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update challenge");
        return;
      }

      onUpdated();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-3 border border-[#E8E0D8] rounded-xl focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition text-[#1A1A1A] bg-[#FDFAF7]";
  const labelClass = "block text-sm font-medium text-[#8B7355] mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 w-full sm:max-w-lg sm:mx-4 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
          Edit Challenge
        </h2>

        {fetchingQuestions ? (
          <div className="py-8 text-center text-[#8B7355]">Loading questions...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Type</label>
              <div className={`${inputClass} bg-[#F5F0EB] text-[#8B7355] cursor-not-allowed`}>
                {{ quiz: "Quiz", task: "Task", streak: "Streak", poll: "Poll", speedrun: "Speed Run", checkin: "Check-in", wager: "Wager", bounty: "Bounty", chain: "Chain", auction: "Auction" }[type]}
              </div>
            </div>

            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inputClass}
                placeholder="Challenge title"
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="What students need to do"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Anchor Session</label>
                <input
                  type="number"
                  min={1}
                  value={anchorSession}
                  onChange={(e) => setAnchorSession(parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Points Reward</label>
                <input
                  type="number"
                  min={0}
                  value={pointsReward}
                  onChange={(e) => setPointsReward(parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Badge Emoji</label>
                <EmojiPicker value={badgeEmoji} onChange={setBadgeEmoji} />
              </div>
              <div>
                <label className={labelClass}>Badge Name</label>
                <input
                  type="text"
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Quiz Master"
                />
              </div>
            </div>

            {type === "streak" && (
              <div>
                <label className={labelClass}>
                  Streak Required (consecutive sessions)
                </label>
                <input
                  type="number"
                  min={1}
                  value={streakRequired}
                  onChange={(e) => setStreakRequired(parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
            )}

            {type === "speedrun" && (
              <div>
                <label className={labelClass}>
                  Winner Slots (how many students earn full points)
                </label>
                <input
                  type="number"
                  min={1}
                  value={speedSlots}
                  onChange={(e) => setSpeedSlots(parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
            )}

            {type === "checkin" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>
                    Scheduled Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={checkinScheduledAt}
                    onChange={(e) => setCheckinScheduledAt(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Window Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={checkinWindowMinutes}
                    onChange={(e) => setCheckinWindowMinutes(parseInt(e.target.value) || 1)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Time-bound toggle */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTimeBound}
                  onChange={(e) => setIsTimeBound(e.target.checked)}
                  className="accent-[#C4A265] w-4 h-4"
                />
                <span className="text-sm font-medium text-[#8B7355]">Time-bound challenge</span>
              </label>
              {isTimeBound && (
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={inputClass}
                  required
                />
              )}
            </div>

            {/* Decay toggle */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={decayEnabled}
                  onChange={(e) => setDecayEnabled(e.target.checked)}
                  className="accent-[#C4A265] w-4 h-4"
                />
                <span className="text-sm font-medium text-[#8B7355]">Decaying points</span>
              </label>
              {decayEnabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Starting Points</label>
                      <input
                        type="number"
                        min={1}
                        value={decayStartPoints}
                        onChange={(e) => setDecayStartPoints(parseInt(e.target.value) || 40)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Points lost per tick</label>
                      <input
                        type="number"
                        min={1}
                        value={decayPointsPerInterval}
                        onChange={(e) => setDecayPointsPerInterval(parseInt(e.target.value) || 1)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Tick every</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min={1}
                        value={decayIntervalValue}
                        onChange={(e) => setDecayIntervalValue(parseInt(e.target.value) || 1)}
                        className={inputClass}
                      />
                      <select
                        value={decayIntervalUnit}
                        onChange={(e) => setDecayIntervalUnit(e.target.value as "seconds" | "minutes" | "hours")}
                        className={`${inputClass} bg-white`}
                      >
                        <option value="seconds">seconds</option>
                        <option value="minutes">minutes</option>
                        <option value="hours">hours</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#8B7355]/70 mt-1">
                      Tip: pair with a deadline to bound the decay window.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {(type === "quiz" || type === "poll" || type === "wager") && (
              <div className="space-y-4">
                <label className="text-sm font-medium text-[#8B7355]">
                  Questions
                </label>

                {questions.map((q, qi) => (
                  <div
                    key={qi}
                    className="border border-[#E8E0D8] rounded-xl p-4 space-y-3 bg-[#FDFAF7]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#8B7355]">
                        Q{qi + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qi)}
                          className="text-xs text-red-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) =>
                        updateQuestion(qi, "questionText", e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none text-[#1A1A1A] bg-white"
                      placeholder="Question text"
                    />

                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        {(type === "quiz" || type === "wager") && (
                          <input
                            type="radio"
                            name={`edit-correct-${qi}`}
                            checked={q.correctIndex === oi}
                            onChange={() => updateQuestion(qi, "correctIndex", oi)}
                            className="accent-green-500"
                          />
                        )}
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          required
                          className="flex-1 px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none text-[#1A1A1A] bg-white"
                          placeholder={`Option ${oi + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-sm text-[#C4A265] hover:underline cursor-pointer font-semibold"
                >
                  + Add Question
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-[#E8E0D8] text-[#8B7355] font-medium rounded-xl hover:bg-[#F5F0EB] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#333] transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
