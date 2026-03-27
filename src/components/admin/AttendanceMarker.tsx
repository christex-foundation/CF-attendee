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
  const [sessionNumber, setSessionNumber] = useState(1);
  const [statuses, setStatuses] = useState<Record<number, "present" | "absent">>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);

    try {
      const records = Object.entries(statuses).map(([studentId, status]) => ({
        studentId: Number(studentId),
        status,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionNumber, records }),
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
            Session Number
          </label>
          <input
            type="number"
            min={1}
            value={sessionNumber}
            onChange={(e) => setSessionNumber(Number(e.target.value))}
            className="w-32 px-4 py-2 border border-[#E8E0D8] rounded-xl focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition text-[#1A1A1A] bg-[#FDFAF7]"
          />
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
