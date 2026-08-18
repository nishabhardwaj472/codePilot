import type {
  FileNode,
  HealthScore,
  MetricEntry,
  Project,
  TimelineEvent,
} from "@/types";

export const project: Project = {
  id: "medchain",
  name: "MedChain",
  repoUrl: "github.com/example/medchain",
  branch: "main",
  fileCount: 42,
  primaryLanguage: "TypeScript",
  lastAnalyzedAt: "Today at 09:44",
  stack: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "Tailwind"],
};

export const metrics: MetricEntry[] = [
  { label: "Files", value: 42, hint: "tracked in src/" },
  { label: "Components", value: 18, hint: "React function components" },
  { label: "API Routes", value: 11, hint: "Express routers" },
  { label: "Models", value: 7, hint: "Mongoose schemas" },
  { label: "Services", value: 4, hint: "domain services" },
];

export const health: HealthScore[] = [
  { label: "Architecture", score: 86, note: "Clean layer separation across API and domain" },
  { label: "Code Organization", score: 79, note: "utils/ is accumulating unrelated helpers" },
  { label: "Documentation", score: 62, note: "6 of 11 routes lack request documentation" },
  { label: "Testing", score: 54, note: "No tests found for services/ or middleware/" },
  { label: "Security", score: 81, note: "JWT verification centralised in authMiddleware" },
];

export const timeline: TimelineEvent[] = [
  { time: "09:42", label: "Repository analyzed — 42 files, 11,204 LOC", tone: "info" },
  { time: "09:43", label: "7 architecture patterns detected", tone: "ok" },
  { time: "09:43", label: "Dependency graph generated — 96 edges", tone: "ok" },
  { time: "09:44", label: "4 potential issues detected", tone: "warn" },
  { time: "09:44", label: "AI insights ready — 12 observations", tone: "info" },
];

export const fileTree: FileNode[] = [
  {
    name: "src",
    path: "src",
    type: "dir",
    children: [
      {
        name: "components",
        path: "src/components",
        type: "dir",
        children: [
          { name: "AppointmentCard.tsx", path: "src/components/AppointmentCard.tsx", type: "file", language: "tsx", loc: 118 },
          { name: "DoctorList.tsx", path: "src/components/DoctorList.tsx", type: "file", language: "tsx", loc: 96 },
          { name: "PatientForm.tsx", path: "src/components/PatientForm.tsx", type: "file", language: "tsx", loc: 204 },
          { name: "ScheduleGrid.tsx", path: "src/components/ScheduleGrid.tsx", type: "file", language: "tsx", loc: 261 },
        ],
      },
      {
        name: "pages",
        path: "src/pages",
        type: "dir",
        children: [
          { name: "Dashboard.tsx", path: "src/pages/Dashboard.tsx", type: "file", language: "tsx", loc: 142 },
          { name: "Appointments.tsx", path: "src/pages/Appointments.tsx", type: "file", language: "tsx", loc: 187 },
          { name: "Doctors.tsx", path: "src/pages/Doctors.tsx", type: "file", language: "tsx", loc: 133 },
        ],
      },
      {
        name: "hooks",
        path: "src/hooks",
        type: "dir",
        children: [
          { name: "useAppointments.ts", path: "src/hooks/useAppointments.ts", type: "file", language: "ts", loc: 74 },
          { name: "useAuthSession.ts", path: "src/hooks/useAuthSession.ts", type: "file", language: "ts", loc: 58 },
        ],
      },
      {
        name: "services",
        path: "src/services",
        type: "dir",
        children: [
          { name: "appointmentService.ts", path: "src/services/appointmentService.ts", type: "file", language: "ts", loc: 164 },
          { name: "authService.ts", path: "src/services/authService.ts", type: "file", language: "ts", loc: 121 },
          { name: "doctorService.ts", path: "src/services/doctorService.ts", type: "file", language: "ts", loc: 98 },
          { name: "notificationService.ts", path: "src/services/notificationService.ts", type: "file", language: "ts", loc: 87 },
        ],
      },
      {
        name: "controllers",
        path: "src/controllers",
        type: "dir",
        children: [
          { name: "appointmentController.ts", path: "src/controllers/appointmentController.ts", type: "file", language: "ts", loc: 132 },
          { name: "authController.ts", path: "src/controllers/authController.ts", type: "file", language: "ts", loc: 104 },
          { name: "doctorController.ts", path: "src/controllers/doctorController.ts", type: "file", language: "ts", loc: 91 },
          { name: "userController.ts", path: "src/controllers/userController.ts", type: "file", language: "ts", loc: 88 },
        ],
      },
      {
        name: "models",
        path: "src/models",
        type: "dir",
        children: [
          { name: "User.ts", path: "src/models/User.ts", type: "file", language: "ts", loc: 62 },
          { name: "Doctor.ts", path: "src/models/Doctor.ts", type: "file", language: "ts", loc: 54 },
          { name: "Appointment.ts", path: "src/models/Appointment.ts", type: "file", language: "ts", loc: 71 },
          { name: "Prescription.ts", path: "src/models/Prescription.ts", type: "file", language: "ts", loc: 48 },
        ],
      },
      {
        name: "routes",
        path: "src/routes",
        type: "dir",
        children: [
          { name: "authRoutes.ts", path: "src/routes/authRoutes.ts", type: "file", language: "ts", loc: 34 },
          { name: "userRoutes.ts", path: "src/routes/userRoutes.ts", type: "file", language: "ts", loc: 41 },
          { name: "appointmentRoutes.ts", path: "src/routes/appointmentRoutes.ts", type: "file", language: "ts", loc: 46 },
        ],
      },
      {
        name: "middleware",
        path: "src/middleware",
        type: "dir",
        children: [
          { name: "authMiddleware.ts", path: "src/middleware/authMiddleware.ts", type: "file", language: "ts", loc: 57 },
          { name: "errorHandler.ts", path: "src/middleware/errorHandler.ts", type: "file", language: "ts", loc: 39 },
          { name: "rateLimit.ts", path: "src/middleware/rateLimit.ts", type: "file", language: "ts", loc: 28 },
        ],
      },
      {
        name: "utils",
        path: "src/utils",
        type: "dir",
        children: [
          { name: "date.ts", path: "src/utils/date.ts", type: "file", language: "ts", loc: 44 },
          { name: "validators.ts", path: "src/utils/validators.ts", type: "file", language: "ts", loc: 82 },
          { name: "logger.ts", path: "src/utils/logger.ts", type: "file", language: "ts", loc: 31 },
        ],
      },
      { name: "server.ts", path: "src/server.ts", type: "file", language: "ts", loc: 66 },
    ],
  },
  { name: "package.json", path: "package.json", type: "file", language: "json", loc: 48 },
  { name: "tsconfig.json", path: "tsconfig.json", type: "file", language: "json", loc: 26 },
  { name: "README.md", path: "README.md", type: "file", language: "md", loc: 74 },
];