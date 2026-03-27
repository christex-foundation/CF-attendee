"use client";

import { useState, useMemo } from "react";
import type { AttendanceRecordWithStudent } from "@/types";
import StudentAvatar from "@/components/ui/StudentAvatar";

interface AttendanceTableProps {
  records: AttendanceRecordWithStudent[];
  loading: boolean;
}

export default function AttendanceTable({ records, loading }: AttendanceTableProps) {
  const [search, setSearch] = useState("");

  const { sessions, students, lookup } = useMemo(() => {
    // Unique sessions sorted ascending, with their date
    const sessionMap = new Map<number, string>();
    for (const r of records) {
      if (!sessionMap.has(r.sessionNumber)) {
        sessionMap.set(r.sessionNumber, r.date);
      }
    }
    const sessions = Array.from(sessionMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([num, date]) => ({ number: num, date }));

    // Unique students sorted by name
    const studentMap = new Map<number, string>();
    for (const r of records) {
      if (!studentMap.has(r.studentId)) {
        studentMap.set(r.studentId, r.studentName);
      }
    }
    const students = Array.from(studentMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));

    // Lookup: "studentId-sessionNumber" -> status
    const lookup = new Map<string, "present" | "absent">();
    for (const r of records) {
      lookup.set(`${r.studentId}-${r.sessionNumber}`, r.status);
    }

    return { sessions, students, lookup };
  }, [records]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, search]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#E8E0D8] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E0D8]">
        <div className="text-4xl mb-3">&#x1F4CB;</div>
        <p className="text-[#8B7355] text-lg mb-2">No attendance records yet</p>
        <p className="text-[#B0A090] text-sm">Mark attendance from the Students tab to see records here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D8] rounded-xl text-sm text-[#1A1A1A] placeholder-[#B0A090] focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E0D8]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#8B7355] uppercase tracking-wider sticky left-0 bg-white z-10 min-w-[180px]">
                  Student
                </th>
                {sessions.map((s) => (
                  <th
                    key={s.number}
                    className="px-4 py-4 text-center min-w-[100px]"
                  >
                    <div className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider">
                      Session {s.number}
                    </div>
                    <div className="text-[10px] text-[#B0A090] mt-0.5 font-normal">
                      {new Date(s.date).toLocaleDateString()}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center min-w-[80px]">
                  <div className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider">
                    Rate
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={sessions.length + 2}
                    className="px-6 py-12 text-center text-[#8B7355] text-sm"
                  >
                    No students match &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const presentCount = sessions.filter(
                    (s) => lookup.get(`${student.id}-${s.number}`) === "present"
                  ).length;
                  const rate = sessions.length > 0
                    ? Math.round((presentCount / sessions.length) * 100)
                    : 0;

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-[#F5F0EB] last:border-0 hover:bg-[#FDFAF7] transition"
                    >
                      <td className="px-6 py-3 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                          <StudentAvatar slug="" name={student.name} size={28} />
                          <span className="font-medium text-[#1A1A1A] text-sm">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      {sessions.map((s) => {
                        const status = lookup.get(`${student.id}-${s.number}`);
                        return (
                          <td key={s.number} className="px-4 py-3 text-center">
                            {status === "present" ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-50 text-green-600">
                                <CheckIcon />
                              </span>
                            ) : status === "absent" ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-500">
                                <XIcon />
                              </span>
                            ) : (
                              <span className="text-[#D0C8BE]">&mdash;</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                            rate >= 80
                              ? "bg-green-50 text-green-700"
                              : rate >= 50
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Icons ─── */
function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A090]"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
