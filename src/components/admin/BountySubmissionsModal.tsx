"use client";

import { useEffect, useState, useCallback } from "react";

interface BountySub {
  id: number;
  studentId: number;
  studentName: string;
  challengeId: number;
  submissionText: string;
  status: "pending" | "approved" | "rejected";
  grade: number | null;
  submittedAt: string;
  reviewedAt: string | null;
}

interface BountySubmissionsModalProps {
  open: boolean;
  challengeId: number | null;
  onClose: () => void;
}

function urlsToLinks(text: string): React.ReactNode {
  const parts = text.split(/(\bhttps?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function BountySubmissionsModal({
  open,
  challengeId,
  onClose,
}: BountySubmissionsModalProps) {
  const [subs, setSubs] = useState<BountySub[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<number | null>(null);

  const fetchSubs = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/submissions`);
      if (res.ok) setSubs(await res.json());
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    if (open && challengeId) {
      setSubs([]);
      fetchSubs();
    }
  }, [open, challengeId, fetchSubs]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !challengeId) return null;

  async function pickWinner(subId: number) {
    setPicking(subId);
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/submissions/${subId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grade: 100 }),
        }
      );
      if (res.ok) await fetchSubs();
    } finally {
      setPicking(null);
    }
  }

  const winner = subs.find((s) => s.status === "approved");
  const pending = subs.filter((s) => s.status === "pending");
  const rejected = subs.filter((s) => s.status === "rejected");
  const hasWinner = !!winner;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 w-full sm:max-w-3xl sm:mx-4 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              Bounty Submissions
            </h2>
            <p className="text-xs text-[#8B7355] mt-0.5">
              {hasWinner
                ? "Winner picked — others auto-rejected"
                : "Pick the first solid submission. The rest will auto-reject."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5F0EB] text-[#8B7355] hover:bg-[#E8E0D8] cursor-pointer text-lg transition"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-[#F5F0EB] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : subs.length === 0 ? (
          <p className="text-[#8B7355] text-center py-8">No submissions yet</p>
        ) : (
          <div className="space-y-6">
            {hasWinner && (
              <Section title="Winner">
                <SubmissionRow
                  sub={winner}
                  outcome="winner"
                  onPick={pickWinner}
                  picking={picking}
                  hasWinner={hasWinner}
                />
              </Section>
            )}

            {pending.length > 0 && (
              <Section title={`Pending (${pending.length})`}>
                {pending.map((s) => (
                  <SubmissionRow
                    key={s.id}
                    sub={s}
                    outcome="pending"
                    onPick={pickWinner}
                    picking={picking}
                    hasWinner={hasWinner}
                  />
                ))}
              </Section>
            )}

            {rejected.length > 0 && (
              <Section title={`Rejected (${rejected.length})`}>
                {rejected.map((s) => (
                  <SubmissionRow
                    key={s.id}
                    sub={s}
                    outcome="rejected"
                    onPick={pickWinner}
                    picking={picking}
                    hasWinner={hasWinner}
                  />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SubmissionRow({
  sub,
  outcome,
  onPick,
  picking,
  hasWinner,
}: {
  sub: BountySub;
  outcome: "winner" | "pending" | "rejected";
  onPick: (id: number) => void;
  picking: number | null;
  hasWinner: boolean;
}) {
  const accentClass =
    outcome === "winner"
      ? "border-green-300 bg-green-50/40"
      : outcome === "rejected"
      ? "border-[#E8E0D8] bg-[#FAFAFA] opacity-70"
      : "border-[#E8E0D8]";

  return (
    <div className={`border rounded-2xl p-3 sm:p-4 ${accentClass}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 shrink-0 rounded-full bg-[#F5E6D3] flex items-center justify-center text-sm font-bold text-[#8B7355]">
          {sub.studentName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#1A1A1A] truncate">
            {sub.studentName}
          </div>
          <div className="text-xs text-[#8B7355]">
            {new Date(sub.submittedAt).toLocaleString()}
          </div>
        </div>
        {outcome === "winner" && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg border bg-green-50 text-green-700 border-green-200 shrink-0">
            Winner
          </span>
        )}
        {outcome === "rejected" && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg border bg-gray-50 text-gray-500 border-gray-200 shrink-0">
            Rejected
          </span>
        )}
      </div>

      <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap break-words bg-white border border-[#F0E8DD] p-3 rounded-xl max-h-48 overflow-y-auto">
        {urlsToLinks(sub.submissionText)}
      </p>

      {outcome === "pending" && !hasWinner && (
        <div className="mt-3">
          <button
            onClick={() => onPick(sub.id)}
            disabled={picking !== null}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50 cursor-pointer"
          >
            {picking === sub.id ? "Picking..." : "Pick this winner"}
          </button>
        </div>
      )}
    </div>
  );
}
