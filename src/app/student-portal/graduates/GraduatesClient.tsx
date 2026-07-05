"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@/lib/toast";
import { UserRole } from "@/lib/auth";
import { generateFarewellCertificates } from "@/lib/farewellCertificate";

interface Graduate {
  id: string;
  studentNameEn: string;
  studentNameBn: string | null;
  fatherName: string;
  roll: number;
  imageUrl: string | null;
  graduatedSession: number | null;
  graduatedAt: string | null;
  class: { nameEn: string; nameBn: string } | null;
}

export default function GraduatesClient({
  userRole,
  userName,
}: {
  userRole: UserRole;
  userName: string;
}) {
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGraduates = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/students?status=graduated");
    if (res.ok) {
      setGraduates(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGraduates();
  }, [fetchGraduates]);

  const filtered = graduates.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.studentNameEn.toLowerCase().includes(q) ||
      (g.studentNameBn && g.studentNameBn.toLowerCase().includes(q)) ||
      g.fatherName.toLowerCase().includes(q) ||
      (g.class?.nameEn.toLowerCase().includes(q) ?? false)
    );
  });

  const downloadCertificate = async (g: Graduate) => {
    try {
      await generateFarewellCertificates([
        {
          studentNameEn: g.studentNameEn,
          studentNameBn: g.studentNameBn,
          fatherName: g.fatherName,
          roll: g.roll,
          classNameEn: g.class?.nameEn ?? "—",
          classNameBn: g.class?.nameBn ?? "—",
          session: g.graduatedSession ?? 0,
        },
      ]);
    } catch {
      toast.error("Failed", "Could not generate the certificate.");
    }
  };

  const downloadAll = async () => {
    if (filtered.length === 0) return;
    try {
      await generateFarewellCertificates(
        filtered.map((g) => ({
          studentNameEn: g.studentNameEn,
          studentNameBn: g.studentNameBn,
          fatherName: g.fatherName,
          roll: g.roll,
          classNameEn: g.class?.nameEn ?? "—",
          classNameBn: g.class?.nameBn ?? "—",
          session: g.graduatedSession ?? 0,
        })),
        { filename: "graduates_certificates" }
      );
    } catch {
      toast.error("Failed", "Could not generate certificates.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/student-portal"
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
                Graduates
              </span>
              <span className="text-xs text-gray-500">
                {userName} ({userRole})
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Graduates / Alumni</h1>
            <p className="text-gray-500 text-sm">
              Students who completed the final class and received farewell.
            </p>
          </div>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={downloadAll}
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download All Certificates
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, father's name, or class..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-600 outline-none bg-white shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No graduates yet</h3>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? "Try a different search."
              : "Graduates appear here after a farewell is given from the final class."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
                  {g.imageUrl ? (
                    <Image
                      src={g.imageUrl}
                      alt={g.studentNameEn}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-bold text-green-700">
                      {g.studentNameEn.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {g.studentNameEn}
                  </p>
                  {g.studentNameBn && (
                    <p className="text-xs text-gray-400 truncate">{g.studentNameBn}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    Father: {g.fatherName}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {g.class?.nameEn ?? "—"}
                </span>
                {g.graduatedSession && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Session {g.graduatedSession}
                  </span>
                )}
              </div>

              <button
                onClick={() => downloadCertificate(g)}
                className="mt-4 w-full bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Certificate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
