"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface ActivityUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  imageUrl: string | null;
}

interface Activity {
  id: string;
  userId: string;
  userRole: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetName: string | null;
  metadata: string | null;
  createdAt: string;
  user: ActivityUser | null;
}

const actionLabels: Record<string, { verb: string; color: string }> = {
  CREATE_CLASS: { verb: "added class", color: "bg-blue-100 text-blue-700" },
  UPDATE_CLASS: { verb: "updated class", color: "bg-amber-100 text-amber-700" },
  DELETE_CLASS: { verb: "deleted class", color: "bg-red-100 text-red-700" },
  CREATE_STUDENT: { verb: "added student", color: "bg-emerald-100 text-emerald-700" },
  UPDATE_STUDENT: { verb: "updated student", color: "bg-amber-100 text-amber-700" },
  DELETE_STUDENT: { verb: "deleted student", color: "bg-red-100 text-red-700" },
  PROMOTE_STUDENTS: { verb: "promoted students", color: "bg-violet-100 text-violet-700" },
  CREATE_TEACHER: { verb: "added teacher", color: "bg-indigo-100 text-indigo-700" },
  UPDATE_TEACHER: { verb: "updated teacher", color: "bg-amber-100 text-amber-700" },
  DELETE_TEACHER: { verb: "deleted teacher", color: "bg-red-100 text-red-700" },
};

const roleBadge: Record<string, string> = {
  student: "bg-sky-100 text-sky-700 border-sky-200",
  teacher: "bg-emerald-100 text-emerald-700 border-emerald-200",
  admin: "bg-amber-100 text-amber-700 border-amber-200",
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTargetLink(activity: Activity): string | null {
  if (!activity.targetId) return null;
  if (activity.targetType === "student") return `/student/${activity.targetId}`;
  if (activity.targetType === "teacher") return `/teacher/${activity.targetId}`;
  if (activity.targetType === "class") return `/student-portal/class/${activity.targetId}`;
  return null;
}

export default function AdminPortalClient({
  userName,
  stats,
}: {
  userName: string;
  stats: {
    students: number;
    teachers: number;
    classes: number;
    activities: number;
  };
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [countByRole, setCountByRole] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [targetFilter, setTargetFilter] = useState<string>("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (targetFilter) params.set("targetType", targetFilter);

    const res = await fetch(`/api/activities?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setActivities(data.activities);
      setCountByRole(data.countByRole || {});
    }
    setLoading(false);
  }, [roleFilter, actionFilter, targetFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const clearFilters = () => {
    setRoleFilter("");
    setActionFilter("");
    setTargetFilter("");
  };

  const parseMetadata = (json: string | null): Record<string, unknown> => {
    if (!json) return {};
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  return (
    <div className="bg-gradient-to-b from-amber-50/40 to-white min-h-[calc(100vh-200px)]">
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
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
                </svg>
                Admin Portal
              </span>
              <span className="text-xs text-gray-500">
                Welcome, <strong>{userName}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              System Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              Oversee activity across students, teachers, and classes
            </p>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total Students"
            value={stats.students}
            color="emerald"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            }
          />
          <StatCard
            label="Total Teachers"
            value={stats.teachers}
            color="indigo"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Classes"
            value={stats.classes}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <StatCard
            label="Activities Logged"
            value={stats.activities}
            color="amber"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* Activity by Role */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                From Students
              </p>
              <p className="text-xl font-extrabold text-sky-600 mt-0.5">
                {countByRole.student || 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Last 30 kept per student</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                From Teachers
              </p>
              <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                {countByRole.teacher || 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Last 25 kept per teacher</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 6 3v11l-6 3-6-3z" />
              </svg>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                From Admins
              </p>
              <p className="text-xl font-extrabold text-amber-600 mt-0.5">
                {countByRole.admin || 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Last 100 kept per admin</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Filter Activity
            </p>
            {(roleFilter || actionFilter || targetFilter) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">All Targets</option>
              <option value="student">Student Records</option>
              <option value="teacher">Teacher Records</option>
              <option value="class">Classes</option>
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">All Actions</option>
              <option value="CREATE_STUDENT">Create Student</option>
              <option value="UPDATE_STUDENT">Update Student</option>
              <option value="DELETE_STUDENT">Delete Student</option>
              <option value="PROMOTE_STUDENTS">Promote Students</option>
              <option value="CREATE_TEACHER">Create Teacher</option>
              <option value="UPDATE_TEACHER">Update Teacher</option>
              <option value="DELETE_TEACHER">Delete Teacher</option>
              <option value="CREATE_CLASS">Create Class</option>
              <option value="UPDATE_CLASS">Update Class</option>
              <option value="DELETE_CLASS">Delete Class</option>
            </select>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Activity Feed</h2>
              <p className="text-xs text-slate-500">
                {activities.length} activities shown
              </p>
            </div>
            <button
              onClick={fetchActivities}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-9 h-9 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">No activity yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Try removing filters or wait for users to perform actions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((a) => {
                const actionMeta = actionLabels[a.action] || {
                  verb: a.action.toLowerCase().replace(/_/g, " "),
                  color: "bg-gray-100 text-gray-700",
                };
                const link = getTargetLink(a);
                const meta = parseMetadata(a.metadata);

                return (
                  <div key={a.id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                        {a.user?.imageUrl ? (
                          <Image
                            src={a.user.imageUrl}
                            alt={a.userName}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-600">
                            {a.userName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">
                            {a.userName}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleBadge[a.userRole] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                          >
                            {a.userRole}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${actionMeta.color}`}
                          >
                            {actionMeta.verb}
                          </span>
                          {a.targetName && (
                            <>
                              {link ? (
                                <Link
                                  href={link}
                                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                                >
                                  {a.targetName}
                                </Link>
                              ) : (
                                <span className="text-sm font-semibold text-slate-700">
                                  {a.targetName}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Metadata */}
                        {Object.keys(meta).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {meta.classNameEn ? (
                              <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                Class: {String(meta.classNameEn)}
                              </span>
                            ) : null}
                            {meta.roll ? (
                              <span className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                Roll: {String(meta.roll)}
                              </span>
                            ) : null}
                            {meta.admissionYear ? (
                              <span className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                Session: {String(meta.admissionYear)}
                              </span>
                            ) : null}
                            {meta.count ? (
                              <span className="text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-100">
                                {String(meta.count)} student{Number(meta.count) !== 1 ? "s" : ""}
                              </span>
                            ) : null}
                            {meta.fromSession && meta.toSession ? (
                              <span className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                {String(meta.fromSession)} → {String(meta.toSession)}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                        {formatTime(a.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "emerald" | "indigo" | "blue" | "amber";
  icon: React.ReactNode;
}) {
  const bg: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    indigo: "bg-indigo-100 text-indigo-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-xl font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
