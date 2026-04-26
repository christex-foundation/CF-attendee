"use client";

import { useState, useEffect } from "react";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { toSeconds } from "@/lib/decay";

interface QuestionInput {
  questionText: string;
  options: string[];
  correctIndex: number;
}

interface CreateChallengeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateChallengeModal({
  open,
  onClose,
  onCreated,
}: CreateChallengeModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"quiz" | "task" | "streak" | "poll" | "speedrun" | "checkin" | "wager" | "bounty" | "chain" | "auction" | "duel">("quiz");
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
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { questionText: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);
  const [isTimeBound, setIsTimeBound] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [decayEnabled, setDecayEnabled] = useState(false);
  const [decayStartPoints, setDecayStartPoints] = useState(40);
  const [decayPointsPerInterval, setDecayPointsPerInterval] = useState(1);
  const [decayIntervalValue, setDecayIntervalValue] = useState(10);
  const [decayIntervalUnit, setDecayIntervalUnit] = useState<"seconds" | "minutes" | "hours">("minutes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

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
        type,
        status: "active",
        pointsReward: type === "poll" ? 0 : pointsReward,
        badgeEmoji: type === "poll" ? null : (badgeEmoji || null),
        badgeName: type === "poll" ? null : (badgeName || null),
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
        if (checkinScheduledAt) {
          body.checkinActivatedAt = new Date(checkinScheduledAt).toISOString();
        }
      }

      if (type === "quiz" || type === "wager") {
        body.questions = questions;
      }

      if (type === "poll") {
        body.questions = questions.map((q) => ({ ...q, correctIndex: -1 }));
      }

      if (type === "wager" || type === "duel") {
        body.wagerMin = wagerMin;
        body.wagerMax = wagerMax;
      }

      if (type === "chain") {
        body.chainRequired = chainRequired;
      }

      if (type === "auction") {
        body.auctionMinBid = auctionMinBid;
      }

      if (type !== "poll" && type !== "checkin" && isTimeBound && deadline) {
        body.deadline = new Date(deadline).toISOString();
      }

      if (type !== "poll" && type !== "checkin") {
        body.decayEnabled = decayEnabled;
        if (decayEnabled) {
          body.decayStartPoints = decayStartPoints;
          body.decayPointsPerInterval = decayPointsPerInterval;
          body.decayIntervalSeconds = toSeconds(decayIntervalValue, decayIntervalUnit);
        }
      }

      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create challenge");
        return;
      }

      setTitle("");
      setDescription("");
      setType("quiz");
      setPointsReward(10);
      setBadgeEmoji("");
      setBadgeName("");
      setAnchorSession(1);
      setStreakRequired(3);
      setSpeedSlots(5);
      setCheckinWindowMinutes(5);
      setCheckinScheduledAt("");
      setWagerMin(5);
      setWagerMax(50);
      setChainRequired(5);
      setAuctionMinBid(10);
      setQuestions([
        { questionText: "", options: ["", "", "", ""], correctIndex: 0 },
      ]);
      setIsTimeBound(false);
      setDeadline("");
      setDecayEnabled(false);
      setDecayStartPoints(40);
      setDecayPointsPerInterval(1);
      setDecayIntervalValue(10);
      setDecayIntervalUnit("minutes");
      onCreated();
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
          Create Challenge
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className={`${inputClass} bg-white`}
            >
              <option value="quiz">Quiz - Students answer questions</option>
              <option value="task">Task - Students submit work for review</option>
              <option value="poll">Poll - Collect responses (no points)</option>
              <option value="speedrun">Speed Run - First N students earn full points</option>
              <option value="checkin">Check-in - Scheduled tap-in window</option>
              <option value="wager">Wager - Bet points on a question</option>
              <option value="bounty">Bounty - First correct answer wins all</option>
              <option value="chain">Chain - Group relay, everyone wins</option>
              <option value="auction">Auction - Bid points, highest wins</option>
              <option value="duel">Duel - Challenge a classmate head-to-head</option>
            </select>
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

          {type === "poll" ? (
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
          ) : (
            <>
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
            </>
          )}

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
                <p className="text-xs text-[#8B7355]/70 mt-1">
                  The check-in button opens at the scheduled time and stays open for this duration.
                </p>
              </div>
            </div>
          )}

          {(type === "wager" || type === "duel") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{type === "duel" ? "Min Stake" : "Min Wager"}</label>
                  <input
                    type="number"
                    min={1}
                    value={wagerMin}
                    onChange={(e) => setWagerMin(parseInt(e.target.value) || 1)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{type === "duel" ? "Max Stake" : "Max Wager"}</label>
                  <input
                    type="number"
                    min={1}
                    value={wagerMax}
                    onChange={(e) => setWagerMax(parseInt(e.target.value) || 1)}
                    className={inputClass}
                  />
                </div>
              </div>
              {type === "duel" && (
                <p className="text-xs text-[#8B7355]/70 -mt-2">
                  Students pick an amount in this range to wager on a classmate. Winner takes the loser&apos;s stake.
                </p>
              )}
            </>
          )}

          {type === "chain" && (
            <div>
              <label className={labelClass}>
                Links Required (how many students needed)
              </label>
              <input
                type="number"
                min={2}
                value={chainRequired}
                onChange={(e) => setChainRequired(parseInt(e.target.value) || 2)}
                className={inputClass}
              />
            </div>
          )}

          {type === "auction" && (
            <div>
              <label className={labelClass}>
                Minimum Bid
              </label>
              <input
                type="number"
                min={1}
                value={auctionMinBid}
                onChange={(e) => setAuctionMinBid(parseInt(e.target.value) || 1)}
                className={inputClass}
              />
              <p className="text-xs text-[#8B7355]/70 mt-1">
                Set a deadline — the highest bidder wins when time runs out.
              </p>
            </div>
          )}

          {/* Time-bound toggle (not for poll/checkin) */}
          {type !== "poll" && type !== "checkin" && (
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
          )}

          {/* Decay toggle (not for poll/checkin) */}
          {type !== "poll" && type !== "checkin" && (
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
          )}

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
                          name={`correct-${qi}`}
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
              {loading ? "Creating..." : "Create Challenge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
