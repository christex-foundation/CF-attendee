"use client";

import { useState, useEffect, useCallback } from "react";
import StudentAvatar from "@/components/ui/StudentAvatar";

interface EditStudentModalProps {
  open: boolean;
  student: { id: number; name: string; slug?: string; avatarUrl?: string | null } | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditStudentModal({
  open,
  student,
  onClose,
  onUpdated,
}: EditStudentModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (student) {
      setName(student.name);
    }
  }, [student]);

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

    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/students/${student!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update student");
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 w-full sm:max-w-md sm:mx-4 animate-slide-up sm:animate-none">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Edit Student</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Avatar display (read-only, students manage their own) */}
          <div className="flex justify-center">
            <StudentAvatar
              slug={student.slug || ""}
              name={student.name}
              size={64}
              avatarUrl={student.avatarUrl}
            />
          </div>
          <p className="text-xs text-[#8B7355] text-center">
            Students can change their own avatar from their profile page
          </p>

          <div>
            <label htmlFor="edit-student-name" className="block text-sm font-medium text-[#8B7355] mb-1">
              Student Name
            </label>
            <input
              id="edit-student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E8E0D8] rounded-xl focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition text-[#1A1A1A] bg-[#FDFAF7]"
              placeholder="Enter student name"
              autoFocus
            />
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
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#333] transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
