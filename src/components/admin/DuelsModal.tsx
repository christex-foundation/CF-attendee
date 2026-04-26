"use client";

import { useEffect, useState, useCallback } from "react";

interface DuelRow {
  id: number;
  challengeId: number;
  challengerId: number;
  opponentId: number;
  challengerName: string;
  opponentName: string;
  wagerAmount: number;
  status: "pending" | "accepted" | "declined" | "submitted" | "resolved" | "void";
  challengerSubmission: string | null;
  opponentSubmission: string | null;
  challengerSubmittedAt: string | null;
  opponentSubmittedAt: string | null;
  winnerId: number | null;
  actualPointsTransferred: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface DuelsModalProps {
  open: boolean;
  challengeId: number | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<DuelRow["status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  declined: { label: "Declined", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  submitted: { label: "Awaiting Verdict", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  resolved: { label: "Resolved", cls: "bg-green-50 text-green-700 border-green-200" },
  void: { label: "Void", cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

export default function DuelsModal({ open, challengeId, onClose }: DuelsModalProps) {
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  const fetchDuels = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/duels`);
      if (res.ok) setDuels(await res.json());
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    if (open && challengeId) {
      setDuels([]);
      fetchDuels();
    }
  }, [open, challengeId, fetchDuels]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !challengeId) return null;

  async function resolve(duelId: number, action: "winner" | "void", winnerId?: number) {
    setResolving(duelId);
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/duels/${duelId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, winnerId }),
        }
      );
      if (res.ok) await fetchDuels();
    } finally {
      setResolving(null);
    }
  }

  const submitted = duels.filter((d) => d.status === "submitted");
  const inFlight = duels.filter((d) => d.status === "pending" || d.status === "accepted");
  const resolved = duels.filter(
    (d) => d.status === "resolved" || d.status === "void" || d.status === "declined"
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 w-full sm:max-w-3xl sm:mx-4 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Resolve Duels</h2>
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
              <div key={i} className="h-32 bg-[#F5F0EB] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : duels.length === 0 ? (
          <p className="text-[#8B7355] text-center py-8">No duels yet</p>
        ) : (
          <div className="space-y-6">
            {/* ─── Awaiting verdict ─── */}
            <Section title={`Awaiting Verdict (${submitted.length})`}>
              {submitted.length === 0 ? (
                <p className="text-xs text-[#8B7355] py-2">Nothing to grade right now.</p>
              ) : (
                submitted.map((d) => (
                  <div
                    key={d.id}
                    className="border border-[#E8E0D8] rounded-2xl p-3 sm:p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-[#8B7355]">
                      <span>{new Date(d.createdAt).toLocaleString()}</span>
                      <span className="font-semibold">Stake: {d.wagerAmount} pts</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <SubmissionCard
                        name={d.challengerName}
                        body={d.challengerSubmission}
                        submittedAt={d.challengerSubmittedAt}
                        accent="border-red-200"
                        roleLabel="Challenger"
                      />
                      <SubmissionCard
                        name={d.opponentName}
                        body={d.opponentSubmission}
                        submittedAt={d.opponentSubmittedAt}
                        accent="border-blue-200"
                        roleLabel="Opponent"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        disabled={resolving === d.id}
                        onClick={() => resolve(d.id, "winner", d.challengerId)}
                        className="flex-1 min-w-[140px] px-3 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {d.challengerName} wins
                      </button>
                      <button
                        disabled={resolving === d.id}
                        onClick={() => resolve(d.id, "winner", d.opponentId)}
                        className="flex-1 min-w-[140px] px-3 py-2 text-sm font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {d.opponentName} wins
                      </button>
                      <button
                        disabled={resolving === d.id}
                        onClick={() => resolve(d.id, "void")}
                        className="px-3 py-2 text-sm font-semibold rounded-lg bg-[#F5F0EB] text-[#8B7355] hover:bg-[#E8E0D8] transition disabled:opacity-50 cursor-pointer"
                      >
                        Void
                      </button>
                    </div>
                  </div>
                ))
              )}
            </Section>

            {/* ─── In flight ─── */}
            <Section title={`In Flight (${inFlight.length})`}>
              {inFlight.length === 0 ? (
                <p className="text-xs text-[#8B7355] py-2">No outstanding duels.</p>
              ) : (
                <div className="space-y-2">
                  {inFlight.map((d) => (
                    <DuelRowSummary key={d.id} d={d} />
                  ))}
                </div>
              )}
            </Section>

            {/* ─── History ─── */}
            <Section title={`History (${resolved.length})`}>
              {resolved.length === 0 ? (
                <p className="text-xs text-[#8B7355] py-2">No resolved duels yet.</p>
              ) : (
                <div className="space-y-2">
                  {resolved.map((d) => (
                    <DuelRowSummary key={d.id} d={d} />
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SubmissionCard({
  name,
  body,
  submittedAt,
  accent,
  roleLabel,
}: {
  name: string;
  body: string | null;
  submittedAt: string | null;
  accent: string;
  roleLabel: string;
}) {
  return (
    <div className={`border rounded-xl p-3 ${accent}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-[#1A1A1A]">{name}</span>
        <span className="text-[10px] text-[#8B7355] uppercase font-semibold">{roleLabel}</span>
      </div>
      {submittedAt && (
        <p className="text-[10px] text-[#8B7355] mb-2">{new Date(submittedAt).toLocaleString()}</p>
      )}
      <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap break-all bg-[#FDFAF7] p-2 rounded-lg max-h-48 overflow-y-auto">
        {body ?? <span className="text-[#8B7355] italic">No submission.</span>}
      </p>
    </div>
  );
}

function DuelRowSummary({ d }: { d: DuelRow }) {
  const meta = STATUS_LABEL[d.status];
  const winnerName =
    d.winnerId === d.challengerId
      ? d.challengerName
      : d.winnerId === d.opponentId
      ? d.opponentName
      : null;
  return (
    <div className="flex items-center justify-between border border-[#E8E0D8] rounded-xl px-3 py-2 text-sm">
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-[#1A1A1A] truncate">
          {d.challengerName} vs {d.opponentName}
        </span>
        <span className="text-xs text-[#8B7355]">
          Stake {d.wagerAmount} pts
          {winnerName && ` · Winner: ${winnerName}`}
          {d.status === "void" && " · Refunded"}
          {d.status === "resolved" && d.actualPointsTransferred != null && d.actualPointsTransferred !== d.wagerAmount && (
            ` · Capped to ${d.actualPointsTransferred}`
          )}
        </span>
      </div>
      <span className={`shrink-0 ml-3 text-xs font-semibold px-2 py-0.5 rounded-lg border ${meta.cls}`}>
        {meta.label}
      </span>
    </div>
  );
}
