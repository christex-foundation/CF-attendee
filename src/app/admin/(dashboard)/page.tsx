"use client";

import { useEffect, useState, useCallback } from "react";
import AddStudentModal from "@/components/admin/AddStudentModal";
import AttendanceMarker from "@/components/admin/AttendanceMarker";
import CreateChallengeModal from "@/components/admin/CreateChallengeModal";
import ChallengesList from "@/components/admin/ChallengesList";
import TaskSubmissionsModal from "@/components/admin/TaskSubmissionsModal";
import DuelsModal from "@/components/admin/DuelsModal";
import BountySubmissionsModal from "@/components/admin/BountySubmissionsModal";
import AddPointsModal from "@/components/admin/AddPointsModal";
import EditStudentModal from "@/components/admin/EditStudentModal";
import EditChallengeModal from "@/components/admin/EditChallengeModal";
import AttendanceTable from "@/components/admin/AttendanceTable";
import StudentAvatar from "@/components/ui/StudentAvatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Student, Challenge, AttendanceRecordWithStudent } from "@/types";

type Tab = "students" | "challenges" | "attendance";

function isChallengeExpired(c: Challenge): boolean {
  const now = Date.now();
  if (c.deadline && new Date(c.deadline).getTime() < now) return true;
  if (
    c.type === "checkin" &&
    c.checkinActivatedAt &&
    new Date(c.checkinActivatedAt).getTime() + (c.checkinWindowSeconds ?? 300) * 1000 < now
  ) {
    return true;
  }
  return false;
}

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordWithStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("students");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [submissionsChallengeId, setSubmissionsChallengeId] = useState<number | null>(null);
  const [submissionsChallengeType, setSubmissionsChallengeType] = useState<"quiz" | "task" | "streak" | "poll" | "speedrun" | "checkin" | "wager" | "bounty" | "chain" | "duel" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pointsStudent, setPointsStudent] = useState<{ id: number; name: string } | null>(null);
  const [editStudent, setEditStudent] = useState<{ id: number; name: string; slug?: string; avatarUrl?: string | null } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [editChallenge, setEditChallenge] = useState<Challenge | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch("/api/students");
      if (res.ok) setStudents(await res.json());
      else setFetchError("Failed to load students");
    } catch {
      setFetchError("Failed to load students. Check your connection.");
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/challenges");
      if (res.ok) setChallenges(await res.json());
      else setFetchError("Failed to load challenges");
    } catch {
      setFetchError("Failed to load challenges. Check your connection.");
    } finally {
      setChallengesLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) setAttendanceRecords(await res.json());
      else setFetchError("Failed to load attendance");
    } catch {
      setFetchError("Failed to load attendance. Check your connection.");
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchChallenges();
    fetchAttendance();
  }, [fetchStudents, fetchChallenges, fetchAttendance]);

  function copyLink(slug: string) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/student/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleDeleteStudent(id: number, name: string) {
    setDeleteTarget({ id, name });
  }

  async function confirmDeleteStudent() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchStudents();
      }
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  const totalSessions = new Set(attendanceRecords.map((r) => r.sessionNumber)).size;
  const loading = tab === "students" ? studentsLoading : tab === "challenges" ? challengesLoading : attendanceLoading;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ─── Fetch error banner ─── */}
      {fetchError && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <span>{fetchError}</span>
          <button
            onClick={() => { setFetchError(null); fetchStudents(); fetchChallenges(); fetchAttendance(); }}
            className="ml-3 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Summary cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <StatCard label="Students" value={students.length} color="bg-[#F5E6D3]" />
        <StatCard label="Sessions" value={totalSessions} color="bg-[#E3F2FD]" />
        <StatCard label="Challenges" value={challenges.length} color="bg-[#E8F5E9]" />
        <StatCard label="Active" value={challenges.filter(c => c.status === "active" && !isChallengeExpired(c)).length} color="bg-[#FFF8E1]" />
        <StatCard label="Archived" value={challenges.filter(c => c.status === "archived").length} color="bg-[#F3E5F5]" />
      </div>

      {/* ─── Tabs + Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-[#E8E0D8] rounded-xl p-1 overflow-x-auto">
          <button
            onClick={() => setTab("students")}
            className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              tab === "students"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#8B7355] hover:text-[#1A1A1A]"
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setTab("challenges")}
            className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              tab === "challenges"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#8B7355] hover:text-[#1A1A1A]"
            }`}
          >
            Challenges
            {challenges.length > 0 && (
              <span className="ml-1.5 text-xs bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded-full">
                {challenges.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("attendance")}
            className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              tab === "attendance"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#8B7355] hover:text-[#1A1A1A]"
            }`}
          >
            Attendance
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-3">
          {tab === "students" ? (
            <>
              <button
                onClick={() => setShowAttendance(true)}
                disabled={students.length === 0}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-[#C4A265] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#B08F50] transition disabled:opacity-50 cursor-pointer"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-[#1A1A1A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#333] transition cursor-pointer"
              >
                + Add Student
              </button>
            </>
          ) : tab === "challenges" ? (
            <button
              onClick={() => setShowCreateChallenge(true)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-[#1A1A1A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#333] transition cursor-pointer"
            >
              + Create Challenge
            </button>
          ) : (
            <button
              onClick={() => setShowAttendance(true)}
              disabled={students.length === 0}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-[#C4A265] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#B08F50] transition disabled:opacity-50 cursor-pointer"
            >
              Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* ─── Students Tab ─── */}
      {tab === "students" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#E8E0D8] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E0D8]">
              <div className="text-4xl mb-3">&#x1F393;</div>
              <p className="text-[#8B7355] text-lg mb-4">No students yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#333] transition cursor-pointer"
              >
                Add Your First Student
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-[#E8E0D8]">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#8B7355] uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#8B7355] uppercase tracking-wider">Slug</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#8B7355] uppercase tracking-wider">Joined</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-[#8B7355] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-[#F5F0EB] last:border-0 hover:bg-[#FDFAF7] transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar slug={student.slug} name={student.name} size={32} avatarUrl={student.avatarUrl} />
                            <span className="font-medium text-[#1A1A1A]">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#8B7355] font-mono">{student.slug}</td>
                        <td className="px-6 py-4 text-sm text-[#8B7355]">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <IconBtn onClick={() => setEditStudent({ id: student.id, name: student.name, slug: student.slug, avatarUrl: student.avatarUrl })} title="Edit" icon={<EditIcon />} />
                            <IconBtn onClick={() => setPointsStudent({ id: student.id, name: student.name })} title="Adjust Points" icon={<PointsIcon />} />
                            <IconBtn onClick={() => copyLink(student.slug)} title={copied === student.slug ? "Copied!" : "Copy Link"} icon={copied === student.slug ? <CheckIcon /> : <LinkIcon />} />
                            <IconBtn
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              title="Delete"
                              icon={<TrashIcon />}
                              danger
                              disabled={deletingId === student.id}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="bg-white rounded-2xl border border-[#E8E0D8] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <StudentAvatar slug={student.slug} name={student.name} size={40} avatarUrl={student.avatarUrl} />
                      <div>
                        <span className="font-semibold text-[#1A1A1A] block">{student.name}</span>
                        <span className="text-xs text-[#8B7355] font-mono">{student.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 border-t border-[#F5F0EB] pt-3">
                      <IconBtn onClick={() => setEditStudent({ id: student.id, name: student.name, slug: student.slug, avatarUrl: student.avatarUrl })} title="Edit" icon={<EditIcon />} />
                      <IconBtn onClick={() => setPointsStudent({ id: student.id, name: student.name })} title="Adjust Points" icon={<PointsIcon />} />
                      <IconBtn onClick={() => copyLink(student.slug)} title={copied === student.slug ? "Copied!" : "Copy Link"} icon={copied === student.slug ? <CheckIcon /> : <LinkIcon />} />
                      <div className="ml-auto">
                        <IconBtn
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          title="Delete"
                          icon={<TrashIcon />}
                          danger
                          disabled={deletingId === student.id}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Challenges Tab ─── */}
      {tab === "challenges" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#E8E0D8] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <ChallengesList
              challenges={challenges}
              onRefresh={fetchChallenges}
              onViewSubmissions={(id, type) => {
                setSubmissionsChallengeId(id);
                setSubmissionsChallengeType(type);
              }}
              onCreateChallenge={() => setShowCreateChallenge(true)}
              onEditChallenge={setEditChallenge}
            />
          )}
        </div>
      )}

      {/* ─── Attendance Tab ─── */}
      {tab === "attendance" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AttendanceTable records={attendanceRecords} loading={attendanceLoading} />
        </div>
      )}

      {/* Modals */}
      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={fetchStudents}
      />
      <AttendanceMarker
        students={students}
        open={showAttendance}
        onClose={() => setShowAttendance(false)}
        onSaved={() => { fetchStudents(); fetchAttendance(); }}
      />
      <CreateChallengeModal
        open={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onCreated={fetchChallenges}
      />
      <TaskSubmissionsModal
        open={
          submissionsChallengeId !== null &&
          submissionsChallengeType !== "duel" &&
          submissionsChallengeType !== "bounty"
        }
        challengeId={submissionsChallengeId}
        challengeType={
          submissionsChallengeType === "duel" || submissionsChallengeType === "bounty"
            ? null
            : submissionsChallengeType
        }
        onClose={() => {
          setSubmissionsChallengeId(null);
          setSubmissionsChallengeType(null);
        }}
      />
      <DuelsModal
        open={submissionsChallengeId !== null && submissionsChallengeType === "duel"}
        challengeId={submissionsChallengeId}
        onClose={() => {
          setSubmissionsChallengeId(null);
          setSubmissionsChallengeType(null);
        }}
      />
      <BountySubmissionsModal
        open={submissionsChallengeId !== null && submissionsChallengeType === "bounty"}
        challengeId={submissionsChallengeId}
        onClose={() => {
          setSubmissionsChallengeId(null);
          setSubmissionsChallengeType(null);
        }}
      />
      <AddPointsModal
        open={pointsStudent !== null}
        student={pointsStudent}
        onClose={() => setPointsStudent(null)}
        onAdded={fetchStudents}
      />
      <EditStudentModal
        open={editStudent !== null}
        student={editStudent}
        onClose={() => setEditStudent(null)}
        onUpdated={fetchStudents}
      />
      <EditChallengeModal
        open={editChallenge !== null}
        challenge={editChallenge}
        onClose={() => setEditChallenge(null)}
        onUpdated={fetchChallenges}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Student"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This will remove all their attendance, progress, and submissions.` : ""}
        onConfirm={confirmDeleteStudent}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingId !== null}
      />
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-2xl p-4 sm:p-5`}>
      <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

/* ─── Icon Button ─── */
function IconBtn({ onClick, title, icon, danger, disabled }: { onClick: () => void; title: string; icon: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition cursor-pointer disabled:opacity-50 ${
        danger
          ? "text-red-500 bg-red-50 hover:bg-red-100"
          : "text-[#8B7355] bg-[#F5F0EB] hover:bg-[#E8E0D8] hover:text-[#1A1A1A]"
      }`}
    >
      {icon}
    </button>
  );
}

/* ─── Icons ─── */
function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PointsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}
