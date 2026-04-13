import Link from "next/link";
import Image from "next/image";

const classColors = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-indigo-500 to-indigo-600",
  "from-red-500 to-red-600",
  "from-cyan-500 to-cyan-600",
  "from-amber-500 to-amber-600",
];

const steps = [
  {
    number: "01",
    title: "Select a Class",
    description:
      "Choose from Class 1 to Class 10 to manage students in that class.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Add Students",
    description:
      "Fill in the admission form with student details, upload photo, and submit.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Filter by Session",
    description:
      "Use the session year filter to view students admitted in a specific year.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Manage Records",
    description:
      "View, update, or delete student records. Click on a student to see full details.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div>
      {/* Banner Section */}
      <section className="relative h-[420px] bg-gradient-to-r from-blue-800 to-blue-600 overflow-hidden">
        <Image
          src="/students_banner_unsplash.jpg"
          alt="School Banner"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            Student Management System
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-8">
            A complete solution for managing student admissions, records, and
            class organization for schools across Bangladesh.
          </p>
          <a
            href="#classes"
            className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-blue-50 transition-all hover:scale-105"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* How to Use Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            How It Works
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Follow these simple steps to manage your students efficiently
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-100 text-center group"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {step.icon}
              </div>
              <span className="text-xs font-bold text-blue-500 tracking-widest uppercase">
                Step {step.number}
              </span>
              <h3 className="text-lg font-semibold text-gray-800 mt-2 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Class Cards */}
      <section id="classes" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              All Classes
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Select a class to manage students, add new admissions, and view
              records
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((classNum) => (
              <Link
                key={classNum}
                href={`/class/${classNum}`}
                className="group"
              >
                <div
                  className={`bg-gradient-to-br ${classColors[classNum - 1]} rounded-2xl p-6 text-white shadow-md hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer`}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-extrabold">
                        {classNum}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-3">
                      Class {classNum}
                    </h3>
                    <span className="inline-block bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-full group-hover:bg-white group-hover:text-gray-800 transition-colors">
                      Manage Students
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
