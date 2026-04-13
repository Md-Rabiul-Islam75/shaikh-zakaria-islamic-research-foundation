export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-semibold mb-3">
              Student Management System
            </h3>
            <p className="text-sm text-gray-400">
              A professional student management platform designed for schools in
              Bangladesh. Manage admissions, track students, and organize classes
              efficiently.
            </p>
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#classes"
                  className="hover:text-white transition-colors"
                >
                  Classes
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: info@studentmanagement.bd</li>
              <li>Phone: +880 1XXX-XXXXXX</li>
              <li>Bangladesh</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Student Management System. All
          rights reserved.
        </div>
      </div>
    </footer>
  );
}
