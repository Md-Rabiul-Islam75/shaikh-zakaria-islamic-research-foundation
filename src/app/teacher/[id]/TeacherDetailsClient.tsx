"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast, modal } from "@/lib/toast";
import { UserRole } from "@/lib/auth";

interface Teacher {
  id: string;
  name: string;
  phone: string;
  role: string;
  imageUrl: string | null;
  imagePublicId: string | null;
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
  createdAt: string;
}

interface ClassItem {
  id: string;
  nameEn: string;
  nameBn: string;
  order: number;
}

export default function TeacherDetailsClient({
  currentUserId,
  userRole,
  teacher,
}: {
  currentUserId: string;
  userRole: UserRole;
  teacher: Teacher;
}) {
  // Only teachers and admins can delete teachers (NOT editors or students)
  const canDelete = userRole === "teacher" || userRole === "admin";
  // Teachers, editors, and admins can edit profiles
  const canEdit =
    userRole === "teacher" || userRole === "admin" || userRole === "editor";
  const isSelf = currentUserId === teacher.id;

  const [editing, setEditing] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    teacher.imageUrl
  );

  const initialResponsible = (() => {
    if (!teacher.responsibleClasses) return [];
    try {
      return JSON.parse(teacher.responsibleClasses) as string[];
    } catch {
      return [];
    }
  })();

  const [form, setForm] = useState({
    name: teacher.name,
    phone: teacher.phone,
    designation: teacher.designation || "",
    qualification: teacher.qualification || "",
    subject: teacher.subject || "",
    gender: teacher.gender || "",
    dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split("T")[0] : "",
    joiningDate: teacher.joiningDate ? teacher.joiningDate.split("T")[0] : "",
    address: teacher.address || "",
    nidNumber: teacher.nidNumber || "",
    bio: teacher.bio || "",
  });
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    new Set(initialResponsible)
  );

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => {});
  }, []);

  const getClassName = (id: string) => {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.nameEn} (${c.nameBn})` : id;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleClass = (id: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = teacher.imageUrl;
    let imagePublicId = teacher.imagePublicId;

    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("folder", "teachers");
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        imageUrl = data.url;
        imagePublicId = data.publicId;
      }
    }

    const payload = {
      ...form,
      responsibleClasses: JSON.stringify(Array.from(selectedClasses)),
      imageUrl,
      imagePublicId,
    };

    const res = await fetch(`/api/teachers/${teacher.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      toast.success("Profile updated", "Changes saved successfully.");
      setEditing(false);
      window.location.reload();
    } else {
      const data = await res.json();
      toast.error("Update failed", data.error || "Please try again");
    }
  };

  const handleDelete = async () => {
    const result = await modal.dangerConfirm(
      `Delete ${teacher.name}?`,
      "This will permanently delete this teacher's account."
    );
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/teachers/${teacher.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Teacher deleted", teacher.name);
      window.location.href = "/teacher-portal";
    } else {
      const data = await res.json();
      toast.error("Delete failed", data.error || "Please try again");
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href="/teacher-portal"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Teachers</span>
        </Link>

        {/* Profile Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 h-32 sm:h-40 relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {!editing && (
                <>
                  {canEdit && (
                    <button
                      onClick={() => setEditing(true)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  {canDelete && !isSelf && (
                    <button
                      onClick={handleDelete}
                      className="bg-red-500/80 hover:bg-red-500 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-6 relative z-10">
            {/* Avatar overlaps the cover banner (pulled up) */}
            <div className="-mt-14 sm:-mt-16 flex justify-center sm:justify-start relative z-20">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt={teacher.name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {teacher.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info — stays below the banner, not pulled up */}
            <div className="mt-3 sm:mt-4 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
                {teacher.name}
                {isSelf && (
                  <span className="ml-2 text-[10px] align-middle font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    YOU
                  </span>
                )}
              </h1>
              <p className="text-indigo-600 font-semibold text-sm sm:text-base mt-1">
                {teacher.designation || "Teacher"}
              </p>
              <p className="text-slate-500 text-sm mt-0.5">
                {teacher.phone}
              </p>
            </div>
          </div>
        </div>

        {editing ? (
          // Edit Form
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6"
          >
            <h2 className="text-lg font-bold text-slate-800 mb-5">Edit Profile</h2>

            {/* Photo upload */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="preview"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 hover:border-indigo-300 px-4 py-2 rounded-lg">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="01XXX-XXXXXX"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This is also the login phone — must be unique.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Head Teacher"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Arabic, Quran"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Dawra-e-Hadith"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NID Number</label>
                <input
                  type="text"
                  value={form.nidNumber}
                  onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Short bio about the teacher"
                />
              </div>
            </div>

            {/* Responsible classes */}
            <div className="mt-6">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Responsible Classes
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Select the classes this teacher is responsible for.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-slate-50">
                {classes.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      selectedClasses.has(c.id)
                        ? "bg-indigo-100 border border-indigo-300"
                        : "bg-white border border-gray-200 hover:border-indigo-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.has(c.id)}
                      onChange={() => toggleClass(c.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-slate-700 truncate">
                      {c.nameEn}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Professional Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Info label="Subject" value={teacher.subject} />
                  <Info label="Qualification" value={teacher.qualification} />
                  <Info label="Designation" value={teacher.designation} />
                  <Info label="Joining Date" value={formatDate(teacher.joiningDate)} />
                </div>
                {teacher.bio && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Bio
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{teacher.bio}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Personal Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Info label="Gender" value={teacher.gender} />
                  <Info label="Date of Birth" value={formatDate(teacher.dateOfBirth)} />
                  <Info label="Phone" value={teacher.phone} />
                  <Info label="NID Number" value={teacher.nidNumber} />
                  <Info
                    label="Address"
                    value={teacher.address}
                    fullWidth
                  />
                </div>
              </div>
            </div>

            {/* Side panel - Responsible Classes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 lg:sticky lg:top-4 lg:self-start">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                Responsible Classes
              </h2>
              {initialResponsible.length === 0 ? (
                <p className="text-sm text-slate-400 italic">
                  No classes assigned yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {initialResponsible.map((id) => (
                    <li
                      key={id}
                      className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-sm font-medium text-indigo-700"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="truncate">{getClassName(id)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-gray-100">
                Joined on {formatDate(teacher.createdAt)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | null;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="text-sm text-slate-800 mt-0.5">{value || "—"}</p>
    </div>
  );
}
