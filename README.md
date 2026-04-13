# Student Management System

A professional, full-stack web application for managing student admissions, records, and class promotions for schools in Bangladesh. Built with Next.js, Prisma, Neon PostgreSQL, and Cloudinary.

## Features

- **Student Admission** — Register students with detailed information (English & Bangla names, guardian info, address, photo upload, etc.)
- **Class-wise Management** — Organize students across Class 1 to Class 10 with session-year filtering
- **Auto Roll Assignment** — Roll numbers are auto-assigned (1, 2, 3...) on admission, fully editable for re-ordering after results
- **Real-time Search** — Instantly filter students by name, roll, phone, or father's name as you type
- **Student Promotion** — Promote students to the next class with history tracking. Select/deselect individual students, assign new roll numbers based on merit
- **Promotion History** — Full timeline of a student's class journey (Class 1 > Class 2 > Class 3...) preserved automatically
- **CRUD Operations** — Create, Read, Update, and Delete student records with SweetAlert2 confirmations
- **Image Upload** — Student photos uploaded and stored via Cloudinary
- **Pagination** — 20 students per page with navigation controls
- **Swagger API Docs** — Interactive API documentation at `/api-doc`
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | Frontend + Backend (App Router) |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Prisma ORM](https://www.prisma.io/) | Database access |
| [Neon PostgreSQL](https://neon.tech/) | Cloud database |
| [Cloudinary](https://cloudinary.com/) | Image storage |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [SweetAlert2](https://sweetalert2.github.io/) | Beautiful alert dialogs |
| [Swagger UI](https://swagger.io/) | API documentation |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage (banner, steps, class cards)
│   ├── layout.tsx                  # Root layout (navbar + footer)
│   ├── globals.css                 # Global styles
│   ├── class/[id]/page.tsx         # Class management (CRUD, search, promote)
│   ├── student/[id]/page.tsx       # Student details + promotion history
│   ├── api-doc/page.tsx            # Swagger UI page
│   └── api/
│       ├── students/route.ts       # GET (list) + POST (create)
│       ├── students/[id]/route.ts  # GET + PUT + DELETE
│       ├── students/history/[id]/route.ts  # GET promotion history
│       ├── promote/route.ts        # POST promote students
│       ├── upload/route.ts         # POST image upload
│       └── doc/route.ts            # GET Swagger JSON spec
├── components/
│   ├── Navbar.tsx                  # Navigation bar + marquee quotes
│   └── Footer.tsx                  # Footer
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── cloudinary.ts               # Cloudinary SDK config
│   └── swagger.ts                  # OpenAPI specification
└── generated/prisma/               # Auto-generated Prisma Client
```

## Database Schema

```
Student
├── id (cuid)
├── studentNameEn, studentNameBn
├── fatherName, motherName
├── dateOfBirth, gender, religion, nationality
├── bloodGroup, birthCertificateNo
├── phone, presentAddress, permanentAddress
├── roll, className (1-10), section
├── admissionYear, admissionFee
├── previousSchool
├── imageUrl, imagePublicId
└── createdAt, updatedAt

ClassHistory
├── id (cuid)
├── studentId → Student
├── className, session, roll, section
├── result (Promoted)
└── createdAt
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A [Neon](https://neon.tech/) PostgreSQL database
- A [Cloudinary](https://cloudinary.com/) account

### 1. Clone the repository

```bash
git clone <repository-url>
cd student-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database - Neon PostgreSQL
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
```

### 4. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for production

```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students?class=1&year=2026` | List students (filter by class & year) |
| `POST` | `/api/students` | Create a new student |
| `GET` | `/api/students/:id` | Get student details |
| `PUT` | `/api/students/:id` | Update a student |
| `DELETE` | `/api/students/:id` | Delete a student |
| `POST` | `/api/upload` | Upload image to Cloudinary |
| `POST` | `/api/promote` | Promote students to next class |
| `GET` | `/api/students/history/:id` | Get student promotion history |

Full interactive documentation available at `/api-doc` (Swagger UI).

## Pages

| Page | URL | Description |
|---|---|---|
| Homepage | `/` | Banner, how-it-works steps, 10 class cards |
| Class Management | `/class/:id` | Add/edit form, student list, search, promote |
| Student Details | `/student/:id` | Full profile, promotion history timeline |
| API Documentation | `/api-doc` | Swagger UI for all endpoints |

## Key Workflows

### Adding a Student
1. Go to Homepage → Click a class card (e.g., Class 1)
2. Select the session year → Click "Add Student"
3. Fill the form (roll is auto-assigned) → Upload photo → Submit

### Promoting Students
1. Go to a class page (e.g., Class 1, Session 2026)
2. Click the green "Promote" button
3. Select/deselect students (uncheck failed students)
4. Assign new roll numbers based on results
5. Confirm → Students move to Class 2, Session 2027
6. Previous class info is saved in promotion history

### Viewing Promotion History
1. Click on any student card → Student details page
2. Scroll down to "Promotion History" timeline
3. See every class the student has been through

## Deployment

This project can be deployed on [Vercel](https://vercel.com/):

```bash
npm run build
```

Set the environment variables in your Vercel project settings and deploy.

## License

This project is for educational purposes.
