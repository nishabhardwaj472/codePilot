import type { AskAnswer, Insight } from "@/types";

export const observations: Insight[] = [
  {
    index: "01",
    title: "Layer separation detected",
    body: "Controllers and services are clearly separated. Controllers never touch Mongoose models directly — all persistence flows through the service layer.",
    meta: [
      { label: "Confidence", value: "94%" },
      { label: "Scope", value: "src/controllers, src/services" },
    ],
    tone: "ok",
  },
  {
    index: "02",
    title: "Centralised authentication boundary",
    body: "Every protected route mounts authMiddleware before its controller. Token verification exists in exactly one place, which keeps the auth surface small.",
    meta: [
      { label: "Confidence", value: "91%" },
      { label: "Routes covered", value: "9 / 11" },
    ],
    tone: "ok",
  },
  {
    index: "03",
    title: "Domain logic leaking into hooks",
    body: "useAppointments.ts recomputes slot conflict rules that already exist in appointmentService.ts. The two implementations can drift apart.",
    meta: [
      { label: "Confidence", value: "78%" },
      { label: "Files", value: "2" },
    ],
    tone: "warn",
  },
];

export const issues: Insight[] = [
  {
    index: "01",
    title: "Potential circular dependency",
    body: "appointmentService.ts imports notificationService.ts, which imports appointmentService.ts back to re-read appointment state. Review recommended.",
    meta: [
      { label: "Severity", value: "High" },
      { label: "Cycle length", value: "2" },
    ],
    tone: "danger",
    trace: ["src/services/appointmentService.ts", "src/services/notificationService.ts"],
  },
  {
    index: "02",
    title: "Unhandled promise rejection path",
    body: "notificationService.sendReminder() is invoked without await inside appointmentService.create(). A failed email dispatch is silently dropped.",
    meta: [
      { label: "Severity", value: "Medium" },
      { label: "Location", value: "appointmentService.ts:118" },
    ],
    tone: "warn",
  },
  {
    index: "03",
    title: "Missing index on frequent query",
    body: "appointments is queried by { doctorId, scheduledFor } on every booking, but only doctorId is indexed in the schema definition.",
    meta: [
      { label: "Severity", value: "Medium" },
      { label: "Model", value: "Appointment.ts" },
    ],
    tone: "warn",
  },
  {
    index: "04",
    title: "No test coverage for middleware",
    body: "authMiddleware.ts and errorHandler.ts have no associated spec files. Regressions in token handling would not be caught.",
    meta: [
      { label: "Severity", value: "Low" },
      { label: "Files", value: "3" },
    ],
    tone: "info",
  },
];

export const recommendations: Insight[] = [
  {
    index: "01",
    title: "Introduce a centralized error handling middleware",
    body: "errorHandler.ts exists but is only mounted on authRoutes. Mount it once in server.ts after all routers and remove the per-controller try/catch blocks.",
    meta: [
      { label: "Impact", value: "Medium" },
      { label: "Effort", value: "Low" },
    ],
    tone: "ok",
  },
  {
    index: "02",
    title: "Break the notification cycle with an event emitter",
    body: "Have appointmentService emit an appointment.created event and let notificationService subscribe. This removes the back-import entirely.",
    meta: [
      { label: "Impact", value: "High" },
      { label: "Effort", value: "Medium" },
    ],
    tone: "warn",
  },
  {
    index: "03",
    title: "Extract scheduling rules into a shared module",
    body: "Move conflict detection out of both useAppointments.ts and appointmentService.ts into src/domain/scheduling.ts so client and server share one rule set.",
    meta: [
      { label: "Impact", value: "Medium" },
      { label: "Effort", value: "Medium" },
    ],
    tone: "info",
  },
];

export const patterns: { name: string; note: string }[] = [
  { name: "REST API", note: "11 resource routes" },
  { name: "MVC", note: "routes → controllers → models" },
  { name: "Repository Pattern", note: "4 services" },
  { name: "JWT Authentication", note: "authMiddleware.ts" },
  { name: "Dependency Injection", note: "constructor-based, 6 sites" },
  { name: "DTO Mapping", note: "controllers only" },
  { name: "Middleware Chain", note: "3 middleware" },
];

export const suggestedQuestions: string[] = [
  "Where does user authentication happen?",
  "How is an appointment created?",
  "Which modules depend on the database?",
  "Why is DoctorService used here?",
  "Show me the request flow for POST /appointments.",
];

export const askAnswers: AskAnswer[] = [
  {
    question: "Where does user authentication happen?",
    summary:
      "Authentication is handled in three coordinated places: the controller accepts credentials, the service verifies them and signs the token, and the middleware validates that token on every protected request.",
    trace: [
      { path: "src/controllers/authController.ts", line: 24, note: "login() reads email + password from the request body" },
      { path: "src/services/authService.ts", line: 41, note: "verifyCredentials() compares the bcrypt hash and signs a JWT" },
      { path: "src/middleware/authMiddleware.ts", line: 17, note: "requireAuth() validates the bearer token and attaches req.user" },
    ],
    snippet: {
      path: "src/services/authService.ts",
      code: `export async function verifyCredentials(email: string, password: string) {\n  const user = await User.findOne({ email }).select("+passwordHash");\n  if (!user) throw new HttpError(401, "Invalid credentials");\n\n  const valid = await bcrypt.compare(password, user.passwordHash);\n  if (!valid) throw new HttpError(401, "Invalid credentials");\n\n  return signAccessToken({ sub: user.id, role: user.role });\n}`,
    },
    related: ["POST /auth/login", "authMiddleware.ts", "User.ts"],
  },
  {
    question: "How is an appointment created?",
    summary:
      "A booking enters through appointmentRoutes, is validated in the controller, then appointmentService checks doctor availability and slot conflicts before the Appointment model persists the document. A confirmation notification is dispatched afterwards.",
    trace: [
      { path: "src/routes/appointmentRoutes.ts", line: 12, note: "POST / is mounted behind requireAuth" },
      { path: "src/controllers/appointmentController.ts", line: 38, note: "create() maps the body to CreateAppointmentDTO" },
      { path: "src/services/appointmentService.ts", line: 62, note: "create() runs conflict detection against existing slots" },
      { path: "src/models/Appointment.ts", line: 44, note: "Appointment.create() writes the document" },
      { path: "src/services/notificationService.ts", line: 29, note: "sendConfirmation() emails the patient" },
    ],
    snippet: {
      path: "src/services/appointmentService.ts",
      code: `export async function create(dto: CreateAppointmentDTO) {\n  const doctor = await Doctor.findById(dto.doctorId);\n  if (!doctor) throw new HttpError(404, "Doctor not found");\n\n  const clash = await Appointment.exists({\n    doctorId: dto.doctorId,\n    scheduledFor: dto.date,\n    status: { $ne: "cancelled" },\n  });\n  if (clash) throw new HttpError(409, "Slot already taken");\n\n  const appointment = await Appointment.create({ ...dto, status: "confirmed" });\n  notificationService.sendConfirmation(appointment); // not awaited\n  return appointment;\n}`,
    },
    related: ["POST /appointments", "appointmentService.ts", "Appointment.ts"],
  },
  {
    question: "Which modules depend on the database?",
    summary:
      "Only the model layer talks to MongoDB. Four services read through those models, so the database has exactly four indirect dependents and no direct access from controllers or the frontend.",
    trace: [
      { path: "src/models/User.ts", line: 8, note: "mongoose.model('User', userSchema)" },
      { path: "src/models/Doctor.ts", line: 7, note: "mongoose.model('Doctor', doctorSchema)" },
      { path: "src/models/Appointment.ts", line: 11, note: "mongoose.model('Appointment', appointmentSchema)" },
      { path: "src/models/Prescription.ts", line: 6, note: "mongoose.model('Prescription', prescriptionSchema)" },
    ],
    related: ["Repositories", "Database", "appointmentService.ts"],
  },
  {
    question: "Why is DoctorService used here?",
    summary:
      "appointmentService calls doctorService to resolve availability windows before writing a booking. It keeps clinic timezone handling in one module instead of duplicating it in the appointment flow.",
    trace: [
      { path: "src/services/appointmentService.ts", line: 58, note: "imports doctorService.getAvailability()" },
      { path: "src/services/doctorService.ts", line: 33, note: "getAvailability() expands clinic opening hours" },
      { path: "src/utils/date.ts", line: 19, note: "toClinicTimezone() normalises the slot" },
    ],
    related: ["doctorService.ts", "Doctor.ts", "GET /doctors/:id/availability"],
  },
  {
    question: "Show me the request flow for POST /appointments.",
    summary:
      "The request passes through five hops. Rate limiting and auth run first, then validation, then the domain service, then persistence. Notification dispatch happens after the response is queued.",
    trace: [
      { path: "src/server.ts", line: 31, note: "app.use('/appointments', appointmentRoutes)" },
      { path: "src/middleware/rateLimit.ts", line: 9, note: "60 requests / minute / IP" },
      { path: "src/middleware/authMiddleware.ts", line: 17, note: "requireAuth() attaches req.user" },
      { path: "src/controllers/appointmentController.ts", line: 38, note: "create() validates and delegates" },
      { path: "src/services/appointmentService.ts", line: 62, note: "create() persists and notifies" },
    ],
    related: ["POST /appointments", "Data Flow", "rateLimit.ts"],
  },
];