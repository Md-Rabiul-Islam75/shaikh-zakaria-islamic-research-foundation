"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";

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
  className: number;
  section: string | null;
  admissionYear: number;
  admissionFee: string;
  previousSchool: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

export default function ClassPage() {
  const params = useParams();
  const classId = Number(params.id);

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 20;
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
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
    admissionFee: "Free",
    previousSchool: "",
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/students?class=${classId}&year=${selectedYear}`
    );
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  }, [classId, selectedYear]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentNameEn.toLowerCase().includes(q) ||
      (s.studentNameBn && s.studentNameBn.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.fatherName.toLowerCase().includes(q) ||
      String(s.roll).includes(q)
    );
  });

  // Pagination
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
      admissionFee: "Free",
      previousSchool: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingStudent(null);
  };

  const handleEdit = (student: Student) => {
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
      admissionFee: student.admissionFee,
      previousSchool: student.previousSchool || "",
    });
    setImagePreview(student.imageUrl || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This student record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) {
      await Swal.fire({
        title: "Deleted!",
        text: "Student record has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchStudents();
    } else {
      Swal.fire("Error!", "Failed to delete student.", "error");
    }
  };

  const openPromoteModal = () => {
    if (filteredStudents.length === 0) {
      Swal.fire("No Students", "There are no students to promote.", "info");
      return;
    }
    if (classId >= 10) {
      Swal.fire("Cannot Promote", "Class 10 students cannot be promoted further.", "info");
      return;
    }
    const allIds = new Set(filteredStudents.map((s) => s.id));
    setSelectedStudents(allIds);
    // Auto-assign rolls 1, 2, 3... based on current order
    const rolls: Record<string, number> = {};
    filteredStudents.forEach((s, i) => {
      rolls[s.id] = i + 1;
    });
    setPromotionRolls(rolls);
    setShowPromoteModal(true);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handlePromote = async () => {
    if (selectedStudents.size === 0) {
      Swal.fire("No Selection", "Please select at least one student to promote.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: `Promote ${selectedStudents.size} Students?`,
      html: `
        <p class="text-gray-600">
          <strong>From:</strong> Class ${classId}, Session ${selectedYear}<br/>
          <strong>To:</strong> Class ${classId + 1}, Session ${selectedYear + 1}
        </p>
        <p class="text-sm text-gray-500 mt-2">This will save their current class history and move them to the next class.</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Promote!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setPromoting(true);

    const studentsToPromote = Array.from(selectedStudents).map((id) => ({
      id,
      newRoll: promotionRolls[id] || 1,
    }));

    const res = await fetch("/api/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        students: studentsToPromote,
        fromClass: classId,
        fromSession: selectedYear,
        toClass: classId + 1,
        toSession: selectedYear + 1,
      }),
    });

    setPromoting(false);

    if (res.ok) {
      const data = await res.json();
      await Swal.fire({
        title: "Promoted!",
        text: data.message,
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
      });
      setShowPromoteModal(false);
      setSelectedStudents(new Set());
      setPromotionRolls({});
      fetchStudents();
    } else {
      Swal.fire("Error!", "Failed to promote students.", "error");
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
    setSubmitting(true);

    let imageUrl = editingStudent?.imageUrl || null;
    let imagePublicId = editingStudent?.imagePublicId || null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
      imagePublicId = uploadData.publicId;
    }

    const { roll, ...formWithoutRoll } = form;
    const payload = {
      ...formWithoutRoll,
      ...(roll ? { roll: parseInt(roll) } : {}),
      className: classId,
      admissionYear: selectedYear,
      imageUrl,
      imagePublicId,
    };

    let res: Response;
    if (editingStudent) {
      res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSubmitting(false);

    if (res.ok) {
      await Swal.fire({
        title: editingStudent ? "Updated!" : "Added!",
        text: editingStudent
          ? "Student record has been updated successfully."
          : "New student has been admitted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      resetForm();
      setShowForm(false);
      fetchStudents();
    } else {
      Swal.fire(
        "Error!",
        "Something went wrong. Please try again.",
        "error"
      );
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
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Class {classId}
            </h1>
            <p className="text-gray-500 text-sm">
              Manage students for Class {classId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Session Year Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">
              Session:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
              />
            </svg>
            {showForm ? "Close Form" : "Add Student"}
          </button>
          {classId < 10 && (
            <button
              onClick={openPromoteModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Promote
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Add/Edit Student Form */}
        {showForm && (
          <div className="lg:w-[420px] shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingStudent ? "Update Student" : "Add New Student"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="flex flex-col items-center mb-4">
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
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
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

                {/* Roll Field - Always Editable */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
                  <label className="block text-sm font-bold text-blue-700 mb-1">
                    Roll No.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.roll}
                    onChange={(e) =>
                      setForm({ ...form, roll: e.target.value })
                    }
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-lg font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    placeholder={editingStudent ? "Update roll number" : "Auto-assigned (or enter manually)"}
                  />
                  {!editingStudent && (
                    <p className="text-xs text-blue-500 mt-1">
                      Leave empty to auto-assign the next roll number
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.studentNameEn}
                      onChange={(e) =>
                        setForm({ ...form, studentNameEn: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name (Bangla)
                    </label>
                    <input
                      type="text"
                      value={form.studentNameBn}
                      onChange={(e) =>
                        setForm({ ...form, studentNameBn: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="বাংলায় নাম লিখুন"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Father&apos;s Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fatherName}
                      onChange={(e) =>
                        setForm({ ...form, fatherName: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mother&apos;s Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.motherName}
                      onChange={(e) =>
                        setForm({ ...form, motherName: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.dateOfBirth}
                      onChange={(e) =>
                        setForm({ ...form, dateOfBirth: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Religion *
                    </label>
                    <select
                      value={form.religion}
                      onChange={(e) =>
                        setForm({ ...form, religion: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option>Islam</option>
                      <option>Hinduism</option>
                      <option>Buddhism</option>
                      <option>Christianity</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={form.bloodGroup}
                      onChange={(e) =>
                        setForm({ ...form, bloodGroup: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birth Certificate No.
                    </label>
                    <input
                      type="text"
                      value={form.birthCertificateNo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          birthCertificateNo: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (Guardian) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="01XXX-XXXXXX"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Present Address *
                    </label>
                    <textarea
                      required
                      value={form.presentAddress}
                      onChange={(e) =>
                        setForm({ ...form, presentAddress: e.target.value })
                      }
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Village/Road, Post Office, Upazila, District"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permanent Address
                    </label>
                    <textarea
                      value={form.permanentAddress}
                      onChange={(e) =>
                        setForm({ ...form, permanentAddress: e.target.value })
                      }
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      value={form.section}
                      onChange={(e) =>
                        setForm({ ...form, section: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="A, B, C..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admission Fee
                    </label>
                    <input
                      type="text"
                      value={form.admissionFee}
                      onChange={(e) =>
                        setForm({ ...form, admissionFee: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Free or amount (e.g. 500)"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous School
                    </label>
                    <input
                      type="text"
                      value={form.previousSchool}
                      onChange={(e) =>
                        setForm({ ...form, previousSchool: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    {submitting
                      ? "Saving..."
                      : editingStudent
                        ? "Update Student"
                        : "Add Student"}
                  </button>
                  {editingStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, roll, phone, or father's name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">
                {filteredStudents.length}
              </span>{" "}
              student{filteredStudents.length !== 1 ? "s" : ""} found
              {searchQuery && (
                <span>
                  {" "}
                  for &quot;{searchQuery}&quot;
                </span>
              )}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                No Students Found
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? "No students match your search. Try a different query."
                  : `No students in Class ${classId} for session ${selectedYear}. Click "Add Student" to get started.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paginatedStudents.map((student) => (
                <Link
                  key={student.id}
                  href={`/student/${student.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Roll Number Badge */}
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-lg font-extrabold text-white">
                        {student.roll}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                      {student.imageUrl ? (
                        <Image
                          src={student.imageUrl}
                          alt={student.studentNameEn}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full rounded-full"
                        />
                      ) : (
                        <span className="text-xl font-bold text-blue-600">
                          {student.studentNameEn.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Roll: {student.roll}
                        </span>
                        {student.section && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            Sec: {student.section}
                          </span>
                        )}
                      </div>
                      <span className="text-base font-semibold text-gray-800 mt-0.5 block">
                        {student.studentNameEn}
                        {student.studentNameBn && (
                          <span className="text-gray-400 font-normal ml-2 text-sm">
                            ({student.studentNameBn})
                          </span>
                        )}
                      </span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                        <span>Father: {student.fatherName}</span>
                        <span>Phone: {student.phone}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(student);
                        }}
                        className="w-9 h-9 bg-gray-100 hover:bg-emerald-100 rounded-lg flex items-center justify-center transition-colors group"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500 group-hover:text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(student.id);
                        }}
                        className="w-9 h-9 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors group"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500 group-hover:text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Promote Students Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-emerald-600 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-xl font-bold">Promote Students</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Class {classId} ({selectedYear}) → Class {classId + 1} ({selectedYear + 1})
              </p>
            </div>

            {/* Select All / Info Bar */}
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.size === filteredStudents.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All
                </span>
              </label>
              <span className="text-sm text-gray-500">
                {selectedStudents.size} of {filteredStudents.length} selected
              </span>
            </div>

            {/* Student List */}
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No students to promote.</p>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        selectedStudents.has(student.id)
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200 bg-white opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 shrink-0"
                      />
                      {/* Current Roll */}
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white">{student.roll}</span>
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {student.studentNameEn}
                        </p>
                        <p className="text-xs text-gray-500">
                          Current Roll: {student.roll}
                        </p>
                      </div>
                      {/* New Roll Input */}
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
                          disabled={!selectedStudents.has(student.id)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:opacity-40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedStudents(new Set());
                  setPromotionRolls({});
                }}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting || selectedStudents.size === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {promoting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Promoting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Promote {selectedStudents.size} Student{selectedStudents.size !== 1 ? "s" : ""}
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
