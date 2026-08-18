export interface FileIntelligence {
  purpose: string;
  dependencies: string[];
  complexity: "Low" | "Medium" | "High";
  loc: number;
  exports: string[];
  lastChanged: string;
  notes: string[];
}

export const codeSamples: Record<string, string> = {
  "src/services/appointmentService.ts": `import { Appointment } from "../models/Appointment";
import { Doctor } from "../models/Doctor";
import * as notificationService from "./notificationService";
import { toClinicTimezone } from "../utils/date";
import { HttpError } from "../utils/errors";
import type { CreateAppointmentDTO } from "../types/appointment";

const CANCELLATION_WINDOW_HOURS = 12;

export async function list(filter: { userId?: string; status?: string }) {
  const query: Record<string, unknown> = {};
  if (filter.userId) query.userId = filter.userId;
  if (filter.status) query.status = filter.status;

  return Appointment.find(query).sort({ scheduledFor: 1 }).limit(100);
}

export async function create(dto: CreateAppointmentDTO) {
  const doctor = await Doctor.findById(dto.doctorId);
  if (!doctor) throw new HttpError(404, "Doctor not found");

  const scheduledFor = toClinicTimezone(dto.date, doctor.clinicId);

  const clash = await Appointment.exists({
    doctorId: dto.doctorId,
    scheduledFor,
    status: { $ne: "cancelled" },
  });
  if (clash) throw new HttpError(409, "Slot already taken");

  const appointment = await Appointment.create({
    ...dto,
    scheduledFor,
    status: "confirmed",
  });

  // TODO: not awaited — a failed dispatch is silently dropped.
  notificationService.sendConfirmation(appointment);

  return appointment;
}

export async function cancel(id: string) {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new HttpError(404, "Appointment not found");

  const hoursLeft = (appointment.scheduledFor.getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < CANCELLATION_WINDOW_HOURS) {
    throw new HttpError(409, "Outside cancellation window");
  }

  appointment.status = "cancelled";
  await appointment.save();
  return appointment;
}`,
  "src/middleware/authMiddleware.ts": `import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/authService";
import { logger } from "../utils/logger";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const claims = verifyAccessToken(header.slice(7));
    req.user = { id: claims.sub, role: claims.role };
    return next();
  } catch (error) {
    logger.warn("auth.reject", { path: req.path });
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role: "admin" | "doctor") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: role + " role required" });
    }
    return next();
  };
}`,
  "src/models/Appointment.ts": `import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
  scheduledFor: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  notes: { type: String, maxlength: 2000 },
}, { timestamps: true });

appointmentSchema.index({ userId: 1, scheduledFor: -1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);`,
  "src/controllers/appointmentController.ts": `import type { Request, Response } from "express";
import * as appointmentService from "../services/appointmentService";
import { createAppointmentSchema } from "../utils/validators";

export async function list(req: Request, res: Response) {
  const items = await appointmentService.list({
    userId: req.query.userId as string | undefined,
    status: req.query.status as string | undefined,
  });
  res.json({ items, total: items.length });
}

export async function create(req: Request, res: Response) {
  const dto = createAppointmentSchema.parse(req.body);
  const appointment = await appointmentService.create(dto);
  res.status(201).json(appointment);
}

export async function cancel(req: Request, res: Response) {
  await appointmentService.cancel(req.params.id);
  res.status(204).end();
}`,
  "src/components/ScheduleGrid.tsx": `import { useMemo } from "react";
import { useAppointments } from "../hooks/useAppointments";
import { formatSlot } from "../utils/date";

interface ScheduleGridProps {
  doctorId: string;
  weekStart: Date;
}

export function ScheduleGrid({ doctorId, weekStart }: ScheduleGridProps) {
  const { appointments, isLoading } = useAppointments({ doctorId, weekStart });

  const slots = useMemo(
    () => buildWeekSlots(weekStart).map((slot) => ({
      slot,
      taken: appointments.some((a) => a.scheduledFor === slot.iso),
    })),
    [appointments, weekStart],
  );

  if (isLoading) return <GridSkeleton />;

  return (
    <div className="grid grid-cols-7 gap-1">
      {slots.map(({ slot, taken }) => (
        <button key={slot.iso} disabled={taken} className="slot">
          {formatSlot(slot.iso)}
        </button>
      ))}
    </div>
  );
}`,
  "src/utils/date.ts": `const CLINIC_TIMEZONES: Record<string, string> = {
  "65fa1c88de20": "Europe/Berlin",
  "65fa1c88de21": "Europe/Lisbon",
};

export function toClinicTimezone(iso: string, clinicId: string) {
  const zone = CLINIC_TIMEZONES[clinicId] ?? "UTC";
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: zone }));
}

export function formatSlot(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}`,
};

export const fileIntelligence: Record<string, FileIntelligence> = {
  "src/services/appointmentService.ts": {
    purpose: "Handles appointment creation, validation and cancellation, including doctor availability checks and clinic timezone normalisation.",
    dependencies: ["Appointment", "Doctor", "notificationService", "date.ts"],
    complexity: "Medium",
    loc: 164,
    exports: ["list", "create", "cancel"],
    lastChanged: "3 days ago · commit a41f9c2",
    notes: [
      "sendConfirmation() is called without await (line 118).",
      "Participates in a 2-file dependency cycle with notificationService.ts.",
    ],
  },
  "src/middleware/authMiddleware.ts": {
    purpose: "Validates bearer tokens on protected routes and attaches the resolved user to the request context.",
    dependencies: ["authService", "logger"],
    complexity: "Low",
    loc: 57,
    exports: ["requireAuth", "requireRole"],
    lastChanged: "2 weeks ago · commit 77be014",
    notes: ["Mounted on 9 of 11 routes.", "No spec file found."],
  },
  "src/models/Appointment.ts": {
    purpose: "Mongoose schema for appointment documents with status lifecycle and compound query indexes.",
    dependencies: ["User", "Doctor"],
    complexity: "Low",
    loc: 71,
    exports: ["Appointment"],
    lastChanged: "5 days ago · commit c02de91",
    notes: ["Missing index on { doctorId, scheduledFor }."],
  },
  "src/controllers/appointmentController.ts": {
    purpose: "Translates HTTP requests into service calls and maps domain results to status codes.",
    dependencies: ["appointmentService", "validators"],
    complexity: "Low",
    loc: 132,
    exports: ["list", "create", "cancel"],
    lastChanged: "3 days ago · commit a41f9c2",
    notes: ["No direct model access — clean layer boundary."],
  },
  "src/components/ScheduleGrid.tsx": {
    purpose: "Renders a weekly booking grid and disables slots already taken for the selected doctor.",
    dependencies: ["useAppointments", "date.ts"],
    complexity: "Medium",
    loc: 261,
    exports: ["ScheduleGrid"],
    lastChanged: "yesterday · commit 91aa77f",
    notes: ["Recomputes conflict rules already present in appointmentService.ts."],
  },
  "src/utils/date.ts": {
    purpose: "Timezone helpers shared between scheduling logic and UI slot formatting.",
    dependencies: [],
    complexity: "Low",
    loc: 44,
    exports: ["toClinicTimezone", "formatSlot"],
    lastChanged: "1 month ago · commit 4b1c8ea",
    notes: ["Clinic timezone map is hardcoded."],
  },
};

export const defaultFilePath = "src/services/appointmentService.ts";

export function getCode(path: string) {
  return (
    codeSamples[path] ??
    `// ${path}\n// CodePilot has indexed this file but the source preview\n// is not part of the demo snapshot.\n\nexport {};\n`
  );
}

export function getIntelligence(path: string): FileIntelligence {
  return (
    fileIntelligence[path] ?? {
      purpose: "Indexed in the dependency graph. No detailed summary in the demo snapshot.",
      dependencies: [],
      complexity: "Low",
      loc: 0,
      exports: [],
      lastChanged: "unknown",
      notes: [],
    }
  );
}