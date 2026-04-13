"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
  createdAt: string;
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      const res = await fetch(`/api/students/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }
      setLoading(false);
    };
    fetchStudent();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Student Not Found
        </h1>
        <p className="text-gray-500 mb-6">
          The student record you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Go back to Home
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | null | undefined;
  }) => {
    if (!value) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-500 sm:w-48 shrink-0">
          {label}
        </span>
        <span className="text-sm text-gray-800 mt-1 sm:mt-0">{value}</span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="font-medium">Back</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur border-4 border-white/50 flex items-center justify-center overflow-hidden shadow-xl">
              {student.imageUrl ? (
                <Image
                  src={student.imageUrl}
                  alt={student.studentNameEn}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {student.studentNameEn.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {student.studentNameEn}
              </h1>
              {student.studentNameBn && (
                <p className="text-blue-100 text-lg mt-1">
                  {student.studentNameBn}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="bg-white text-blue-700 text-sm font-bold px-3 py-1 rounded-full">
                  Roll: {student.roll}
                </span>
                <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
                  Class {student.className}
                </span>
                <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
                  Session {student.admissionYear}
                </span>
                {student.section && (
                  <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
                    Section {student.section}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Student Details */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
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
                Personal Information
              </h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <InfoRow
                  label="Date of Birth"
                  value={formatDate(student.dateOfBirth)}
                />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Religion" value={student.religion} />
                <InfoRow label="Nationality" value={student.nationality} />
                <InfoRow label="Blood Group" value={student.bloodGroup} />
                <InfoRow
                  label="Birth Certificate"
                  value={student.birthCertificateNo}
                />
              </div>
            </div>

            {/* Family Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Family & Contact
              </h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <InfoRow label="Father's Name" value={student.fatherName} />
                <InfoRow label="Mother's Name" value={student.motherName} />
                <InfoRow label="Phone (Guardian)" value={student.phone} />
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Address
              </h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <InfoRow
                  label="Present Address"
                  value={student.presentAddress}
                />
                <InfoRow
                  label="Permanent Address"
                  value={student.permanentAddress}
                />
              </div>
            </div>

            {/* Academic Info */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Academic Info
              </h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <InfoRow
                  label="Roll No."
                  value={String(student.roll)}
                />
                <InfoRow
                  label="Class"
                  value={`Class ${student.className}`}
                />
                <InfoRow label="Section" value={student.section} />
                <InfoRow
                  label="Admission Year"
                  value={String(student.admissionYear)}
                />
                <InfoRow label="Admission Fee" value={student.admissionFee} />
                <InfoRow
                  label="Previous School"
                  value={student.previousSchool}
                />
                <InfoRow
                  label="Admitted On"
                  value={formatDate(student.createdAt)}
                />
              </div>
            </div>
          </div>

          {/* Student ID */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">Student ID: {student.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
