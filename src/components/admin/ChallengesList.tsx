"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Challenge } from "@/types";

interface ChallengesListProps {
  challenges: Challenge[];
  onRefresh: () => void;
  onViewSubmissions: (challengeId: number, challengeType: Challenge["type"]) => void;
  onCreateChallenge: () => void;
  onEditChallenge: (challenge: Challenge) => void;
}

const typeBadge = {
  quiz: { bg: "bg-purple-50 text-purple-700 border-purple-200", label: "Quiz" },
  task: { bg: "bg-teal-50 text-teal-700 border-teal-200", label: "Task" },
  streak: { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Streak" },
  poll: { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Poll" },
  speedrun: { bg: "bg-orange-50 text-orange-700 border-orange-200", label: "Speed Run" },
  checkin: { bg: "bg-sky-50 text-sky-700 border-sky-200", label: "Check-in" },
  wager: { bg: "bg-pink-50 text-pink-700 border-pink-200", label: "Wager" },
  bounty: { bg: "bg-lime-50 text-lime-700 border-lime-200", label: "Bounty" },
  chain: { bg: "bg-violet-50 text-violet-700 border-violet-200", label: "Chain" },
  auction: { bg: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Auction" },
  duel: { bg: "bg-red-50 text-red-700 border-red-200", label: "Duel" },
};

const statusBadge = {
  draft: "bg-[#F5F0EB] text-[#8B7355] border-[#E8E0D8]",
  active: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-red-50 text-red-600 border-red-200",
};

export default function ChallengesList({
  challenges,
  onRefresh,
  onViewSubmissions,
  onCreateChallenge,
  onEditChallenge,
}: ChallengesListProps) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
  const [settlingAuction, setSettlingAuction] = useState<number | null>(null);

  async function settleAuction(challengeId: number) {
    setSettlingAuction(challengeId);
    try {
      await fetch(`/api/challenges/${challengeId}/settle-auction`, { method: "POST" });
      onRefresh();
    } finally {
      setSettlingAuction(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      const res = await fetch(`/api/challenges/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  }

  async function toggleStatus(challenge: Challenge) {
    const newStatus = challenge.status === "active" ? "archived" : "active";
    await fetch(`/api/challenges/${challenge.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onRefresh();
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E0D8]">
        <div className="text-4xl mb-3">&#x1F3AF;</div>
        <p className="text-[#8B7355] text-lg mb-4">No challenges yet</p>
        <button
          onClick={onCreateChallenge}
          className="px-5 py-2.5 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#333] transition cursor-pointer"
        >
          Create Your First Challenge
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-3">
      {challenges.map((c) => (
        <div
          key={c.id}
          className="bg-white rounded-2xl border border-[#E8E0D8] p-4 hover:shadow-sm transition"
        >
          {/* Top row: title + badges */}
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[#1A1A1A] truncate">
                  {c.badgeEmoji && <span className="mr-1">{c.badgeEmoji}</span>}
                  {c.title}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border shrink-0 ${typeBadge[c.type].bg}`}>
                  {typeBadge[c.type].label}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border shrink-0 ${statusBadge[c.status]}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-[#8B7355] mt-0.5 line-clamp-1">
                {c.description}
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-[#8B7355] mb-3">
            <span>Session #{c.anchorSession}</span>
            <span>{c.pointsReward} pts</span>
            {c.type === "streak" && c.streakRequired && (
              <span>{c.streakRequired} streak required</span>
            )}
            {c.type === "speedrun" && c.speedSlots && (
              <span>{c.speedSlots} winner slots</span>
            )}
            {c.type === "checkin" && c.checkinWindowSeconds && (
              <span>{Math.round(c.checkinWindowSeconds / 60)}min window</span>
            )}
            {c.type === "poll" && (
              <span className="text-rose-500">No points</span>
            )}
            {c.type === "wager" && c.wagerMin != null && (
              <span>Wager: {c.wagerMin}–{c.wagerMax} pts</span>
            )}
            {c.type === "chain" && c.chainRequired && (
              <span>{c.chainRequired} links needed</span>
            )}
            {c.type === "auction" && c.auctionMinBid && (
              <span>Min bid: {c.auctionMinBid} pts</span>
            )}
            {c.type === "duel" && c.wagerMin != null && (
              <span>Stake: {c.wagerMin}–{c.wagerMax} pts</span>
            )}
            {c.badgeName && <span>Badge: {c.badgeName}</span>}
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F5F0EB]">
            <button
              onClick={() => onEditChallenge(c)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F5F0EB] text-[#1A1A1A] hover:bg-[#E8E0D8] transition cursor-pointer"
            >
              Edit
            </button>

            <button
              onClick={() => toggleStatus(c)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F5F0EB] text-[#1A1A1A] hover:bg-[#E8E0D8] transition cursor-pointer"
            >
              {c.status === "active" ? "Archive" : "Activate"}
            </button>

            {(c.type === "task" || c.type === "quiz" || c.type === "bounty") && (
              <button
                onClick={() => onViewSubmissions(c.id, c.type)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F5E6D3] text-[#8B7355] hover:bg-[#EADCC6] transition cursor-pointer"
              >
                {c.type === "quiz" ? "View Attempts" : "View Submissions"}
              </button>
            )}

            {c.type === "duel" && (
              <button
                onClick={() => onViewSubmissions(c.id, c.type)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
              >
                Resolve Duels
              </button>
            )}

            {c.type === "poll" && (
              <button
                onClick={() => onViewSubmissions(c.id, c.type)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                View Results
              </button>
            )}

            {c.type === "auction" && c.status === "active" && (
              <button
                onClick={() => settleAuction(c.id)}
                disabled={settlingAuction === c.id}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition cursor-pointer disabled:opacity-50"
              >
                {settlingAuction === c.id ? "Settling..." : "Settle Auction"}
              </button>
            )}

            {c.type === "checkin" && c.checkinActivatedAt && (
              <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-50 text-sky-700">
                {new Date(c.checkinActivatedAt) > new Date()
                  ? `Scheduled: ${new Date(c.checkinActivatedAt).toLocaleString()}`
                  : "Window passed"}
              </span>
            )}

            <button
              onClick={() => setDeleteTarget(c)}
              disabled={deleting === c.id}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer disabled:opacity-50 ml-auto"
            >
              {deleting === c.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
    <ConfirmDialog
      open={deleteTarget !== null}
      title="Delete Challenge"
      message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This will remove all submissions and progress for this challenge.` : ""}
      onConfirm={confirmDelete}
      onCancel={() => setDeleteTarget(null)}
      loading={deleting !== null}
    />
    </>
  );
}
