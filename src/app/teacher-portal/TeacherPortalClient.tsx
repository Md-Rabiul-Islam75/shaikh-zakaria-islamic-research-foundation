"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast, modal } from "@/lib/toast";
import { UserRole } from "@/lib/auth";

interface Teacher {
  id: string;
  name: string;
  phone: string;
  imageUrl: string | null;
  designation: string | null;
  qualification: string | null;
  subject: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  nidNumber: string | null;
  joiningDate: string | null;
  bio: string | null;
  responsibleClasses: string | null;
}

interface ClassItem {
  id: string;
  nameEn: string;
  nameBn: string;
  order: number;
}

export default function TeacherPortalClient({
  currentUserId,
  userRole,
  userName,
}: {
  currentUserId: string;
  userRole: UserRole;
  userName: string;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const canDelete = userRole === "admin";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [teachersRes, classesRes] = await Promise.all([
      fetch("/api/teachers"),
      fetch("/api/classes"),
    ]);
    if (teachersRes.ok) setTeachers(await teachersRes.json());
    if (classesRes.ok) setClasses(await classesRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      (t.designation && t.designation.toLowerCase().includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q))
    );
  });

  const getResponsibleClassNames = (json: string | null) => {
    if (!json) return [];
    try {
      const ids: string[] = JSON.parse(json);
      return ids
        .map((id) => classes.find((c) => c.id === id))
        .filter((c): c is ClassItem => !!c);
    } catch {
      return [];
    }
  };

  // Stats
  const totalClassesCovered = new Set(
    teachers.flatMap((t) => {
      try {
        return t.responsibleClasses ? (JSON.parse(t.responsibleClasses) as string[]) : [];
      } catch {
        return [];
      }
    })
  ).size;
  const uniqueSubjects = new Set(
    teachers.map((t) => t.subject).filter((s): s is string => !!s)
  ).size;

  const handleDelete = async (teacher: Teacher) => {
    if (!canDelete) {
      toast.warning("Not allowed", "Only admins can delete teacher accounts.");
      return;
    }

    const result = await modal.dangerConfirm(
      `Delete ${teacher.name}?`,
      "This will permanently delete this teacher's account."
    );
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/teachers/${teacher.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Teacher deleted", teacher.name);
      fetchAll();
    } else {
      const data = await res.json();
      toast.error("Delete failed", data.error || "Please try again");
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <Link
            href="/"
            className="w-10 h-10 shrink-0 bg-white hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 6 3v11l-6 3-6-3z" />
                </svg>
                Teacher Portal
              </span>
              <span className="text-xs text-gray-500">
                {userName} ({userRole})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Staff Directory
            </h1>
            <p className="text-slate-500 text-sm">
              Professional profiles of all teachers at our Madrasa
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Teachers
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {teachers.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Classes Covered
            </p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">
              {totalClassesCovered}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Subjects
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {uniqueSubjects}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Classes
            </p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              {classes.length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, designation, or subject..."
              className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-800">{filtered.length}</span>{" "}
          teacher{filtered.length !== 1 ? "s" : ""} found
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No teachers yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Teachers who register will appear here. Share the registration
              link and select the &quot;Teacher&quot; role during sign up.
            </p>
            <Link
              href="/register"
              className="inline-block mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Register
            </Link>
          </div>
        ) : viewMode === "list" ? (
          // Professional List View — unique to Teacher Portal
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filtered.map((t) => {
                const respClasses = getResponsibleClassNames(t.responsibleClasses);
                const isSelf = t.id === currentUserId;

                return (
                  <div
                    key={t.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar with colored accent */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden shadow-sm">
                          {t.imageUrl ? (
                            <Image
                              src={t.imageUrl}
                              alt={t.name}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="text-2xl sm:text-3xl font-bold text-white">
                              {t.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {isSelf && (
                          <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shadow">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                              {t.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-sm font-medium text-indigo-600">
                                {t.designation || "Teacher"}
                              </span>
                              {t.subject && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-sm text-slate-500">
                                    {t.subject}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="truncate">{t.phone}</span>
                          </div>
                          {t.qualification && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              </svg>
                              <span className="truncate">{t.qualification}</span>
                            </div>
                          )}
                          {t.joiningDate && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>
                                Joined {new Date(t.joiningDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Responsible Classes */}
                        {respClasses.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Teaches:
                            </span>
                            {respClasses.slice(0, 4).map((c) => (
                              <span
                                key={c.id}
                                className="text-[11px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md border border-indigo-100"
                              >
                                {c.nameEn}
                              </span>
                            ))}
                            {respClasses.length > 4 && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                +{respClasses.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <Link
                          href={`/teacher/${t.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                        >
                          View
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                        {canDelete && !isSelf && (
                          <button
                            onClick={() => handleDelete(t)}
                            className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Grid View — professional business card style
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => {
              const respClasses = getResponsibleClassNames(t.responsibleClasses);
              const isSelf = t.id === currentUserId;

              return (
                <div
                  key={t.id}
                  className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all"
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-600" />

                  <div className="p-5 pl-6">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden shrink-0">
                        {t.imageUrl ? (
                          <Image
                            src={t.imageUrl}
                            alt={t.name}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {t.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-800 truncate">
                          {t.name}
                        </h3>
                        <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                          {t.designation || "Teacher"}
                        </p>
                        {t.subject && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {t.subject}
                          </p>
                        )}
                      </div>
                      {isSelf && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="truncate">{t.phone}</span>
                      </div>
                      {t.qualification && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          </svg>
                          <span className="truncate">{t.qualification}</span>
                        </div>
                      )}
                    </div>

                    {respClasses.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {respClasses.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md border border-indigo-100"
                          >
                            {c.nameEn}
                          </span>
                        ))}
                        {respClasses.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{respClasses.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/teacher/${t.id}`}
                        className="flex-1 text-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        View Profile
                      </Link>
                      {canDelete && !isSelf && (
                        <button
                          onClick={() => handleDelete(t)}
                          className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
