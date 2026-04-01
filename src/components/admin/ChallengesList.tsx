"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Challenge } from "@/types";

interface ChallengesListProps {
  challenges: Challenge[];
  onRefresh: () => void;
  onViewSubmissions: (challengeId: number, challengeType: "quiz" | "task" | "streak") => void;
  onCreateChallenge: () => void;
  onEditChallenge: (challenge: Challenge) => void;
}

const typeBadge = {
  quiz: { bg: "bg-purple-50 text-purple-700 border-purple-200", label: "Quiz" },
  task: { bg: "bg-teal-50 text-teal-700 border-teal-200", label: "Task" },
  streak: { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Streak" },
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
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
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

            {(c.type === "task" || c.type === "quiz") && (
              <button
                onClick={() => onViewSubmissions(c.id, c.type)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F5E6D3] text-[#8B7355] hover:bg-[#EADCC6] transition cursor-pointer"
              >
                {c.type === "quiz" ? "View Attempts" : "View Submissions"}
              </button>
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
