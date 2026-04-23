"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast, modal } from "@/lib/toast";
import Swal from "sweetalert2";
import { UserRole } from "@/lib/auth";

interface Student {
  id: string;
  studentNameEn: string;
  studentNameBn: string | null;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  religion: string;
  nationality: string;
  bloodGroup: string | null;
  birthCertificateNo: string | null;
  phone: string;
  presentAddress: string;
  permanentAddress: string | null;
  roll: number;
  classId: string;
  section: string | null;
  admissionYear: number;
  admissionType: string;
  admissionFee: string;
  previousSchool: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
}

interface ClassInfo {
  id: string;
  nameEn: string;
  nameBn: string;
  description: string | null;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

export default function ClassStudentsClient({
  userRole,
  userName,
  classInfo,
}: {
  userRole: UserRole;
  userName: string;
  classInfo: ClassInfo;
}) {
  const canModify = userRole === "teacher" || userRole === "admin";

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 20;

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Promote modal state
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [allClasses, setAllClasses] = useState<{ id: string; nameEn: string; nameBn: string; order: number }[]>([]);
  const [promoteTargetClassId, setPromoteTargetClassId] = useState<string>("");
  const [promoteTargetSession, setPromoteTargetSession] = useState<number>(selectedYear + 1);
  const [selectedForPromotion, setSelectedForPromotion] = useState<Set<string>>(new Set());
  const [promotionRolls, setPromotionRolls] = useState<Record<string, number>>({});
  const [promoting, setPromoting] = useState(false);

  const [form, setForm] = useState({
    studentNameEn: "",
    studentNameBn: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "Male",
    religion: "Islam",
    nationality: "Bangladeshi",
    bloodGroup: "",
    birthCertificateNo: "",
    phone: "",
    presentAddress: "",
    permanentAddress: "",
    roll: "",
    section: "",
    admissionType: "free",
    admissionFee: "Free",
    previousSchool: "",
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/students?classId=${classInfo.id}&year=${selectedYear}`
    );
    if (res.ok) {
      setStudents(await res.json());
    }
    setLoading(false);
  }, [classInfo.id, selectedYear]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentNameEn.toLowerCase().includes(q) ||
      (s.studentNameBn && s.studentNameBn.toLowerCase().includes(q)) ||
      s.phone.includes(q) ||
      s.fatherName.toLowerCase().includes(q) ||
      String(s.roll).includes(q)
    );
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const resetForm = () => {
    setForm({
      studentNameEn: "",
      studentNameBn: "",
      fatherName: "",
      motherName: "",
      dateOfBirth: "",
      gender: "Male",
      religion: "Islam",
      nationality: "Bangladeshi",
      bloodGroup: "",
      birthCertificateNo: "",
      phone: "",
      presentAddress: "",
      permanentAddress: "",
      roll: "",
      section: "",
      admissionType: "free",
      admissionFee: "Free",
      previousSchool: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingStudent(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (student: Student) => {
    if (!canModify) {
      toast.warning(
        "Not allowed",
        "Only teachers and admins can edit student records."
      );
      return;
    }
    setEditingStudent(student);
    setForm({
      studentNameEn: student.studentNameEn,
      studentNameBn: student.studentNameBn || "",
      fatherName: student.fatherName,
      motherName: student.motherName,
      dateOfBirth: student.dateOfBirth.split("T")[0],
      gender: student.gender,
      religion: student.religion,
      nationality: student.nationality,
      bloodGroup: student.bloodGroup || "",
      birthCertificateNo: student.birthCertificateNo || "",
      phone: student.phone,
      presentAddress: student.presentAddress,
      permanentAddress: student.permanentAddress || "",
      roll: String(student.roll),
      section: student.section || "",
      admissionType: student.admissionType || "free",
      admissionFee: student.admissionFee,
      previousSchool: student.previousSchool || "",
    });
    setImagePreview(student.imageUrl || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (student: Student) => {
    if (!canModify) {
      toast.warning(
        "Not allowed",
        "Only teachers and admins can delete students."
      );
      return;
    }

    const result = await modal.dangerConfirm(
      `Delete ${student.studentNameEn}?`,
      "This will permanently delete this student record."
    );
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Student deleted", student.studentNameEn);
      fetchStudents();
    } else {
      const data = await res.json();
      toast.error("Delete failed", data.error || "Please try again");
    }
  };

  const openPromoteModal = async () => {
    if (!canModify) {
      toast.warning("Not allowed", "Only teachers and admins can promote students.");
      return;
    }
    if (filteredStudents.length === 0) {
      toast.info("No students", "There are no students to promote.");
      return;
    }

    // Fetch all classes for the target selector
    const res = await fetch("/api/classes");
    if (res.ok) {
      const classes = await res.json();
      setAllClasses(classes);
      // Default target: next class by order
      const current = classes.find((c: { id: string }) => c.id === classInfo.id);
      const nextClass = classes.find(
        (c: { order: number }) => c.order === (current?.order ?? 0) + 1
      );
      setPromoteTargetClassId(nextClass?.id || "");
    }

    setPromoteTargetSession(selectedYear + 1);
    const ids = new Set(filteredStudents.map((s) => s.id));
    setSelectedForPromotion(ids);
    const rolls: Record<string, number> = {};
    filteredStudents.forEach((s, i) => {
      rolls[s.id] = i + 1;
    });
    setPromotionRolls(rolls);
    setShowPromoteModal(true);
  };

  const togglePromoteSelection = (id: string) => {
    setSelectedForPromotion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePromoteSelectAll = () => {
    if (selectedForPromotion.size === filteredStudents.length) {
      setSelectedForPromotion(new Set());
    } else {
      setSelectedForPromotion(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handlePromote = async () => {
    if (selectedForPromotion.size === 0) {
      toast.warning("No selection", "Please select at least one student.");
      return;
    }
    if (!promoteTargetClassId) {
      toast.warning("No target class", "Please select the target class.");
      return;
    }

    const targetClass = allClasses.find((c) => c.id === promoteTargetClassId);

    const result = await Swal.fire({
      title: `Promote ${selectedForPromotion.size} student(s)?`,
      html: `
        <p class="text-gray-600 text-sm">
          <strong>From:</strong> ${classInfo.nameEn} (Session ${selectedYear})<br/>
          <strong>To:</strong> ${targetClass?.nameEn || "—"} (Session ${promoteTargetSession})
        </p>
        <p class="text-xs text-gray-500 mt-3">
          This will save their current class info to history and move them to the target class.
        </p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Promote",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    setPromoting(true);

    const studentsToPromote = Array.from(selectedForPromotion).map((id) => ({
      id,
      newRoll: promotionRolls[id] || 1,
    }));

    try {
      const res = await fetch("/api/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: studentsToPromote,
          fromClassId: classInfo.id,
          fromSession: selectedYear,
          toClassId: promoteTargetClassId,
          toSession: promoteTargetSession,
        }),
      });

      setPromoting(false);

      if (res.ok) {
        const data = await res.json();
        toast.success("Promoted!", data.message);
        setShowPromoteModal(false);
        setSelectedForPromotion(new Set());
        setPromotionRolls({});
        fetchStudents();
      } else {
        const data = await res.json();
        toast.error("Promotion failed", data.error || "Please try again");
      }
    } catch {
      setPromoting(false);
      toast.error("Network error", "Please check your connection.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Student confirmation before first save
    if (!editingStudent && userRole === "student") {
      const result = await Swal.fire({
        title: "Are you sure everything is correct?",
        html: `
          <div class="text-left text-sm space-y-1">
            <p><strong>Name:</strong> ${form.studentNameEn}</p>
            <p><strong>Class:</strong> ${classInfo.nameEn} (${classInfo.nameBn})</p>
            <p><strong>Session:</strong> ${selectedYear}</p>
            <p><strong>Father:</strong> ${form.fatherName}</p>
            <p><strong>Phone:</strong> ${form.phone}</p>
          </div>
          <p class="mt-3 text-xs text-amber-600">⚠️ As a student, you cannot modify or delete this record after saving. Please double-check all details.</p>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Add Student",
        cancelButtonText: "Let me review",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
      });
      if (!result.isConfirmed) return;
    }

    setSubmitting(true);

    let imageUrl = editingStudent?.imageUrl || null;
    let imagePublicId = editingStudent?.imagePublicId || null;

    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
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

    const { roll, ...formWithoutRoll } = form;
    const payload = {
      ...formWithoutRoll,
      ...(roll ? { roll: parseInt(roll) } : {}),
      classId: classInfo.id,
      admissionYear: selectedYear,
      imageUrl,
      imagePublicId,
    };

    try {
      const url = editingStudent
        ? `/api/students/${editingStudent.id}`
        : "/api/students";
      const method = editingStudent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSubmitting(false);

      if (res.ok) {
        toast.success(
          editingStudent ? "Student updated" : "Student added",
          form.studentNameEn
        );
        resetForm();
        setShowForm(false);
        fetchStudents();
      } else {
        const data = await res.json();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Link
            href="/student-portal"
            className="w-10 h-10 shrink-0 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Student Portal
              </span>
              <span className="text-xs text-gray-500">
                {userName} ({userRole})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">
              {classInfo.nameEn}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              {classInfo.nameBn}
              {classInfo.description && ` — ${classInfo.description}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Session Year */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 hidden sm:inline">
              Session:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                openAddForm();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 sm:px-5 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
              />
            </svg>
            {showForm ? "Close Form" : "Add Student"}
          </button>

          {canModify && (
            <button
              onClick={openPromoteModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 sm:px-5 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Promote
            </button>
          )}
        </div>
      </div>

      {/* Student Notice */}
      {!canModify && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Student Access Notice</h3>
            <p className="text-sm text-amber-700 mt-0.5">
              You can add new students, but cannot edit or delete existing
              records. A confirmation will be shown before saving — please
              double-check all details.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="lg:w-[420px] lg:shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 lg:sticky lg:top-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5">
                {editingStudent ? "Update Student" : "Add New Student"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="flex flex-col items-center mb-2">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full rounded-full"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Roll */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <label className="block text-sm font-bold text-blue-700 mb-1">
                    Roll No.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.roll}
                    onChange={(e) => setForm({ ...form, roll: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-base font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder={editingStudent ? "Update roll" : "Auto-assigned"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Student Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={form.studentNameEn}
                      onChange={(e) => setForm({ ...form, studentNameEn: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Student Name (Bangla)</label>
                    <input
                      type="text"
                      value={form.studentNameBn}
                      onChange={(e) => setForm({ ...form, studentNameBn: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Father&apos;s Name *</label>
                    <input
                      type="text"
                      required
                      value={form.fatherName}
                      onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mother&apos;s Name *</label>
                    <input
                      type="text"
                      required
                      value={form.motherName}
                      onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Religion *</label>
                    <select
                      value={form.religion}
                      onChange={(e) => setForm({ ...form, religion: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option>Islam</option>
                      <option>Hinduism</option>
                      <option>Buddhism</option>
                      <option>Christianity</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Group</label>
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select</option>
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>O+</option>
                      <option>O-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Birth Cert. No.</label>
                    <input
                      type="text"
                      value={form.birthCertificateNo}
                      onChange={(e) => setForm({ ...form, birthCertificateNo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone (Guardian) *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Present Address *</label>
                    <textarea
                      required
                      value={form.presentAddress}
                      onChange={(e) => setForm({ ...form, presentAddress: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Permanent Address</label>
                    <textarea
                      value={form.permanentAddress}
                      onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Admission Type *</label>
                    <select
                      value={form.admissionType}
                      onChange={(e) => setForm({ ...form, admissionType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="full_paid">Full Paid</option>
                      <option value="half_paid">Half Paid</option>
                      <option value="free">Free</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Admission Fee</label>
                    <input
                      type="text"
                      value={form.admissionFee}
                      onChange={(e) => setForm({ ...form, admissionFee: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Previous School</label>
                    <input
                      type="text"
                      value={form.previousSchool}
                      onChange={(e) => setForm({ ...form, previousSchool: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors"
                  >
                    {submitting
                      ? "Saving..."
                      : editingStudent
                        ? "Update Student"
                        : "Add Student"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, roll, phone, or father's name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            <span className="font-semibold text-gray-800">{filteredStudents.length}</span>{" "}
            student{filteredStudents.length !== 1 ? "s" : ""} found
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">No students found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? "Try a different search query."
                  : `No students in ${classInfo.nameEn} for session ${selectedYear}.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedStudents.map((student) => (
                <Link
                  key={student.id}
                  href={`/student/${student.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-base font-extrabold text-white">
                        {student.roll}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                      {student.imageUrl ? (
                        <Image
                          src={student.imageUrl}
                          alt={student.studentNameEn}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full rounded-full"
                        />
                      ) : (
                        <span className="text-lg font-bold text-blue-600">
                          {student.studentNameEn.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                        {student.studentNameEn}
                      </p>
                      {student.studentNameBn && (
                        <p className="text-xs text-gray-400 truncate">
                          {student.studentNameBn}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Father: {student.fatherName}
                      </p>
                    </div>
                    {canModify && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            openEditForm(student);
                          }}
                          className="w-8 h-8 bg-gray-100 hover:bg-emerald-100 rounded-lg flex items-center justify-center group"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(student);
                          }}
                          className="w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center group"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === p
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-emerald-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Promote Students</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  From <strong>{classInfo.nameEn}</strong> (Session {selectedYear})
                </p>
              </div>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Target Selector */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Class *
                  </label>
                  <select
                    value={promoteTargetClassId}
                    onChange={(e) => setPromoteTargetClassId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select target class</option>
                    {allClasses
                      .filter((c) => c.id !== classInfo.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameEn} ({c.nameBn})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Session *
                  </label>
                  <select
                    value={promoteTargetSession}
                    onChange={(e) => setPromoteTargetSession(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Select All */}
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedForPromotion.size === filteredStudents.length &&
                    filteredStudents.length > 0
                  }
                  onChange={togglePromoteSelectAll}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </label>
              <span className="text-sm text-gray-500">
                {selectedForPromotion.size} of {filteredStudents.length} selected
              </span>
            </div>

            {/* Student list */}
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No students to promote.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        selectedForPromotion.has(student.id)
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200 bg-white opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedForPromotion.has(student.id)}
                        onChange={() => togglePromoteSelection(student.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 shrink-0"
                      />
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white">
                          {student.roll}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {student.studentNameEn}
                        </p>
                        <p className="text-xs text-gray-500">
                          Current Roll: {student.roll}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-xs text-gray-500">New Roll:</label>
                        <input
                          type="number"
                          min="1"
                          value={promotionRolls[student.id] || ""}
                          onChange={(e) =>
                            setPromotionRolls((prev) => ({
                              ...prev,
                              [student.id]: parseInt(e.target.value) || 1,
                            }))
                          }
                          disabled={!selectedForPromotion.has(student.id)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:opacity-40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting || selectedForPromotion.size === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {promoting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Promoting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Promote {selectedForPromotion.size} student{selectedForPromotion.size !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
