"use client";

import { useState, useEffect } from "react";

interface Student {
  id: number;
  name: string;
  slug: string;
}

interface AttendanceMarkerProps {
  students: Student[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AttendanceMarker({
  students,
  open,
  onClose,
  onSaved,
}: AttendanceMarkerProps) {
  const [sessionDate, setSessionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [sessionNumber, setSessionNumber] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Record<number, "present" | "absent">>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingSessions, setExistingSessions] = useState<{ sessionNumber: number; date: string }[]>([]);

  // Fetch existing session data to determine session numbers
  useEffect(() => {
    if (open) {
      fetch("/api/attendance")
        .then((res) => res.json())
        .then((records: { sessionNumber: number; date: string }[]) => {
          // Build unique session-date pairs
          const sessionMap = new Map<number, string>();
          for (const r of records) {
            if (!sessionMap.has(r.sessionNumber)) {
              sessionMap.set(r.sessionNumber, r.date);
            }
          }
          const sessions = Array.from(sessionMap.entries())
            .map(([sessionNumber, date]) => ({ sessionNumber, date }))
            .sort((a, b) => a.sessionNumber - b.sessionNumber);
          setExistingSessions(sessions);
        })
        .catch(() => {});
    }
  }, [open]);

  // Auto-derive session number from date
  useEffect(() => {
    if (!sessionDate) {
      setSessionNumber(null);
      return;
    }

    if (existingSessions.length === 0) {
      setSessionNumber(1);
      return;
    }

    const selectedDate = new Date(sessionDate).toDateString();

    // Check if this date matches an existing session
    const existing = existingSessions.find((s) => {
      const sDate = new Date(s.date).toDateString();
      return sDate === selectedDate;
    });

    if (existing) {
      setSessionNumber(existing.sessionNumber);
    } else {
      // New session: assign next number
      const maxSession = existingSessions.reduce((max, s) => Math.max(max, s.sessionNumber), 0);
      setSessionNumber(maxSession + 1);
    }
  }, [sessionDate, existingSessions]);

  // Reinitialize statuses whenever the modal opens or students change
  useEffect(() => {
    if (open && students.length > 0) {
      const initial: Record<number, "present" | "absent"> = {};
      students.forEach((s) => (initial[s.id] = "present"));
      setStatuses(initial);
    }
  }, [open, students]);

  if (!open) return null;

  function toggleStatus(studentId: number) {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }

  async function handleSave() {
    setError("");

    if (!sessionNumber || sessionNumber < 1) {
      setError("Invalid session number");
      return;
    }

    setLoading(true);

    try {
      const records = Object.entries(statuses).map(([studentId, status]) => ({
        studentId: Number(studentId),
        status,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionNumber, date: sessionDate, records }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save attendance");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
          Mark Attendance
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#8B7355] mb-1">
            Session Date
          </label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full px-4 py-2 border border-[#E8E0D8] rounded-xl focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition text-[#1A1A1A] bg-[#FDFAF7]"
          />
          {sessionNumber && (
            <p className="text-xs text-[#8B7355] mt-1.5">
              Session #{sessionNumber}
              {existingSessions.some((s) => s.sessionNumber === sessionNumber) &&
                " (updating existing session)"}
            </p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 bg-[#FDFAF7] rounded-xl border border-[#F5F0EB]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5E6D3] flex items-center justify-center text-xs font-bold text-[#8B7355]">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-[#1A1A1A]">{student.name}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleStatus(student.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  statuses[student.id] === "present"
                    ? "bg-green-500 text-white"
                    : "bg-red-400 text-white"
                }`}
              >
                {statuses[student.id] === "present" ? "Present" : "Absent"}
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-[#E8E0D8] text-[#8B7355] font-medium rounded-xl hover:bg-[#F5F0EB] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || students.length === 0}
            className="flex-1 py-3 bg-[#C4A265] text-white font-semibold rounded-xl hover:bg-[#B08F50] transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
