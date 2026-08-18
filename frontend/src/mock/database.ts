import type { DbRelation, DbTable } from "@/types";

export const dbTables: DbTable[] = [
  {
    id: "users",
    name: "USERS",
    collection: "users",
    rows: "12,480",
    columns: [
      { name: "id", type: "ObjectId", key: "pk" },
      { name: "name", type: "string" },
      { name: "email", type: "string" },
      { name: "passwordHash", type: "string" },
      { name: "role", type: "enum" },
      { name: "createdAt", type: "Date" },
    ],
    x: 40,
    y: 40,
  },
  {
    id: "appointments",
    name: "APPOINTMENTS",
    collection: "appointments",
    rows: "48,912",
    columns: [
      { name: "id", type: "ObjectId", key: "pk" },
      { name: "userId", type: "ObjectId", key: "fk" },
      { name: "doctorId", type: "ObjectId", key: "fk" },
      { name: "scheduledFor", type: "Date" },
      { name: "status", type: "enum" },
      { name: "createdAt", type: "Date" },
    ],
    x: 380,
    y: 260,
  },
  {
    id: "doctors",
    name: "DOCTORS",
    collection: "doctors",
    rows: "312",
    columns: [
      { name: "id", type: "ObjectId", key: "pk" },
      { name: "name", type: "string" },
      { name: "speciality", type: "string" },
      { name: "clinicId", type: "ObjectId", key: "fk" },
    ],
    x: 720,
    y: 40,
  },
  {
    id: "prescriptions",
    name: "PRESCRIPTIONS",
    collection: "prescriptions",
    rows: "21,044",
    columns: [
      { name: "id", type: "ObjectId", key: "pk" },
      { name: "appointmentId", type: "ObjectId", key: "fk" },
      { name: "medication", type: "string" },
      { name: "dosage", type: "string" },
      { name: "issuedAt", type: "Date" },
    ],
    x: 380,
    y: 560,
  },
  {
    id: "clinics",
    name: "CLINICS",
    collection: "clinics",
    rows: "64",
    columns: [
      { name: "id", type: "ObjectId", key: "pk" },
      { name: "name", type: "string" },
      { name: "city", type: "string" },
      { name: "timezone", type: "string" },
    ],
    x: 1040,
    y: 300,
  },
];

export const dbRelations: DbRelation[] = [
  { id: "r1", source: "users", target: "appointments", cardinality: "1:N" },
  { id: "r2", source: "appointments", target: "doctors", cardinality: "N:1" },
  { id: "r3", source: "appointments", target: "prescriptions", cardinality: "1:N" },
  { id: "r4", source: "doctors", target: "clinics", cardinality: "N:1" },
];