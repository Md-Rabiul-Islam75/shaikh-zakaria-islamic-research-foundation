"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast, modal } from "@/lib/toast";
import { UserRole } from "@/lib/auth";

interface ClassItem {
  id: string;
  nameEn: string;
  nameBn: string;
  description: string | null;
  order: number;
  createdAt: string;
}

const classColors = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-orange-500 to-red-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-lime-500 to-green-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
  "from-teal-500 to-emerald-600",
  "from-indigo-500 to-violet-600",
  "from-red-500 to-rose-600",
  "from-green-500 to-teal-600",
  "from-violet-500 to-indigo-600",
];

export default function StudentPortalClient({
  userRole,
  userName,
}: {
  userRole: UserRole;
  userName: string;
}) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nameEn: "",
    nameBn: "",
    description: "",
  });

  // Teachers, editors, and admins can edit classes
  const canModify =
    userRole === "teacher" || userRole === "admin" || userRole === "editor";
  // Only teachers and admins can delete classes (NOT editors)
  const canDelete = userRole === "teacher" || userRole === "admin";

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/classes");
    if (res.ok) {
      const data = await res.json();
      setClasses(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const resetForm = () => {
    setForm({ nameEn: "", nameBn: "", description: "" });
    setEditing(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (cls: ClassItem) => {
    if (!canModify) {
      toast.warning("Not allowed", "Only teachers and admins can edit classes.");
      return;
    }
    setEditing(cls);
    setForm({
      nameEn: cls.nameEn,
      nameBn: cls.nameBn,
      description: cls.description || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nameEn.trim() || !form.nameBn.trim()) {
      toast.warning("Missing fields", "English and Bangla names are required.");
      return;
    }

    setSubmitting(true);

    try {
      const url = editing ? `/api/classes/${editing.id}` : "/api/classes";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        toast.success(
          editing ? "Class updated" : "Class added",
          `${data.nameEn} (${data.nameBn})`
        );
        closeForm();
        fetchClasses();
      } else {
        if (res.status === 403) {
          toast.error("Not allowed", data.error);
        } else {
          toast.error("Failed", data.error || "Please try again");
        }
      }
    } catch {
      setSubmitting(false);
      toast.error("Network error", "Please check your connection.");
    }
  };

  const handleDelete = async (cls: ClassItem) => {
    if (!canDelete) {
      toast.warning("Not allowed", "Only teachers and admins can delete classes.");
      return;
    }

    const result = await modal.dangerConfirm(
      `Delete "${cls.nameEn}"?`,
      "This will permanently remove this class. Students in this class won't be deleted, but the class reference will be lost."
    );
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/classes/${cls.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Class deleted", cls.nameEn);
        fetchClasses();
      } else {
        const data = await res.json();
        toast.error("Delete failed", data.error || "Please try again");
      }
    } catch {
      toast.error("Network error", "Please check your connection.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
                Student Portal
              </span>
              <span className="text-xs text-gray-500">
                Logged in as <strong>{userName}</strong> ({userRole})
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">All Classes</h1>
            <p className="text-gray-500 text-sm">
              Madrasa classes from basic to advanced levels
            </p>
          </div>
        </div>
        {canModify && (
          <button
            onClick={openAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Class
          </button>
        )}
      </div>

      {/* Read-only notice for students */}
      {!canModify && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-800">View-only access</h3>
            <p className="text-sm text-blue-700 mt-0.5">
              Browse classes and view student details. Adding or editing
              classes is reserved for editors, teachers, and admins.
            </p>
          </div>
        </div>
      )}

      {/* Class Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No classes yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            {canModify
              ? "Be the first to add a class."
              : "Classes will appear here once they are added."}
          </p>
          {canModify && (
            <button
              onClick={openAddForm}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Add First Class
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {classes.map((cls, idx) => (
            <div
              key={cls.id}
              className={`relative bg-gradient-to-br ${classColors[idx % classColors.length]} rounded-2xl p-6 text-white shadow-md hover:shadow-2xl transition-all hover:-translate-y-1 group`}
            >
              {/* Actions (teacher/admin only) — always visible on touch devices,
                  fades in on hover for desktop */}
              {canModify && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditForm(cls)}
                    className="w-9 h-9 bg-white/30 hover:bg-white/50 active:bg-white/60 backdrop-blur rounded-lg flex items-center justify-center"
                    title="Edit class"
                    aria-label="Edit class"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(cls)}
                      className="w-9 h-9 bg-white/30 hover:bg-red-500/80 active:bg-red-500/90 backdrop-blur rounded-lg flex items-center justify-center"
                      title="Delete class"
                      aria-label="Delete class"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl font-extrabold">{cls.order}</span>
              </div>

              <h3 className="text-lg font-bold leading-tight">{cls.nameEn}</h3>
              <p className="text-sm text-white/90 mt-1">{cls.nameBn}</p>
              {cls.description && (
                <p className="text-xs text-white/75 mt-3 line-clamp-2">
                  {cls.description}
                </p>
              )}

              <div className="mt-5 pt-4 border-t border-white/20">
                <Link
                  href={`/student-portal/class/${cls.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
                >
                  Manage Students
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editing ? "Edit Class" : "Add New Class"}
                </h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {editing ? "Update class details" : "Enter class name in both languages"}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Hifz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name (Bangla) *
                </label>
                <input
                  type="text"
                  required
                  value={form.nameBn}
                  onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="যেমন: হিফজ"
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can paste the translated name here.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Brief description of this class"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  {submitting
                    ? "Saving..."
                    : editing
                      ? "Update Class"
                      : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
