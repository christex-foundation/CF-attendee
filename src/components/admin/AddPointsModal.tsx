"use client";

import { useState, useEffect, useCallback } from "react";

interface AddPointsModalProps {
  open: boolean;
  student: { id: number; name: string } | null;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPointsModal({
  open,
  student,
  onClose,
  onAdded,
}: AddPointsModalProps) {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  if (!open || !student) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const pointsNum = parseInt(points, 10);
    if (isNaN(pointsNum) || pointsNum === 0) {
      setError("Please enter a valid non-zero number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/students/${student!.id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: pointsNum, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add points");
        return;
      }

      setPoints("");
      setReason("");
      onAdded();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 w-full sm:max-w-md sm:mx-4 animate-slide-up sm:animate-none">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">Add Points</h2>
        <p className="text-sm text-[#8B7355] mb-4">
          Manually add or deduct points for <span className="font-semibold text-[#1A1A1A]">{student.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="add-points-value" className="block text-sm font-medium text-[#8B7355] mb-1">
              Points
            </label>
            <input
              id="add-points-value"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E8E0D8] rounded-xl focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition text-[#1A1A1A] bg-[#FDFAF7]"
              placeholder="e.g. 10 or -5"
              autoFocus
            />
            <p className="text-xs text-[#8B7355] mt-1">
              Use positive numbers to add, negative to deduct
            </p>
          </div>

          <div>
            <label htmlFor="add-points-reason" className="block text-sm font-medium text-[#8B7355] mb-1">
              Reason <span className="text-[#C4A265]">(optional)</span>
            </label>
            <input
              id="add-points-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-[#E8E0D8] rounded-xl focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition text-[#1A1A1A] bg-[#FDFAF7]"
              placeholder="e.g. Bonus for helping others"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setPoints("");
                setReason("");
                setError("");
                onClose();
              }}
              className="flex-1 py-3 border border-[#E8E0D8] text-[#8B7355] font-medium rounded-xl hover:bg-[#F5F0EB] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#333] transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Adding..." : "Add Points"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
