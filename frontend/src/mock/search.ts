import type { SearchItem } from "@/types";

export const searchIndex: SearchItem[] = [
  { group: "Files", label: "appointmentService.ts", detail: "src/services · 164 LOC", to: "/files" },
  { group: "Files", label: "authMiddleware.ts", detail: "src/middleware · 57 LOC", to: "/files" },
  { group: "Files", label: "Appointment.ts", detail: "src/models · 71 LOC", to: "/files" },
  { group: "Files", label: "ScheduleGrid.tsx", detail: "src/components · 261 LOC", to: "/files" },
  { group: "Files", label: "date.ts", detail: "src/utils · 44 LOC", to: "/files" },
  { group: "APIs", label: "POST /appointments", detail: "appointmentController.create", to: "/apis" },
  { group: "APIs", label: "POST /auth/login", detail: "authController.login", to: "/apis" },
  { group: "APIs", label: "GET /users/:id", detail: "userController.getById", to: "/apis" },
  { group: "APIs", label: "DELETE /appointments/:id", detail: "appointmentController.cancel", to: "/apis" },
  { group: "Classes", label: "AppointmentService", detail: "domain service · 3 exports", to: "/architecture" },
  { group: "Classes", label: "AuthService", detail: "domain service · 4 exports", to: "/architecture" },
  { group: "Classes", label: "DoctorService", detail: "domain service · 2 exports", to: "/architecture" },
  { group: "Insights", label: "Circular dependency warning", detail: "appointmentService ↔ notificationService", to: "/insights" },
  { group: "Insights", label: "Missing index on frequent query", detail: "Appointment.ts", to: "/insights" },
  { group: "Insights", label: "Layer separation detected", detail: "confidence 94%", to: "/insights" },
  { group: "Pages", label: "Repository Overview", detail: "/dashboard", to: "/dashboard" },
  { group: "Pages", label: "Architecture Canvas", detail: "/architecture", to: "/architecture" },
  { group: "Pages", label: "Dependency Graph", detail: "/dependencies", to: "/dependencies" },
  { group: "Pages", label: "Database Diagram", detail: "/database", to: "/database" },
  { group: "Pages", label: "Ask CodePilot", detail: "/ask", to: "/ask" },
];