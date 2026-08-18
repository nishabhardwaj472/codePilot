export type StatusTone = "ok" | "warn" | "danger" | "info" | "idle";

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  fileCount: number;
  primaryLanguage: string;
  lastAnalyzedAt: string;
  stack: string[];
}

export interface MetricEntry {
  label: string;
  value: number;
  hint?: string;
}

export interface HealthScore {
  label: string;
  score: number;
  note: string;
}

export interface TimelineEvent {
  time: string;
  label: string;
  tone: StatusTone;
}

export interface FileNode {
  name: string;
  path: string;
  type: "dir" | "file";
  file?: boolean;
  directory?: boolean;
  language?: string;
  loc?: number;
  children?: FileNode[];
}

export interface ArchModule {
  id: string;
  label: string;
  layer: string;
  files: number;
  tech: string;
  status: StatusTone;
  responsibilities: string[];
  fileList: string[];
  dependencies: number;
  dependents: number;
  group: "overview" | "modules" | "dataflow";
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  group: "overview" | "modules" | "dataflow";
}

export interface DependencyNode {
  id: string;
  file: string;
  path: string;
  kind: "service" | "controller" | "model" | "route" | "middleware" | "util" | "component";
  imports: string[];
  importedBy: string[];
  circular: number;
  complexity: "Low" | "Medium" | "High";
  x: number;
  y: number;
}

export interface DbColumn {
  name: string;
  type: string;
  key?: "pk" | "fk";
}

export interface DbTable {
  id: string;
  name: string;
  collection: string;
  rows: string;
  columns: DbColumn[];
  x: number;
  y: number;
}

export interface DbRelation {
  id: string;
  source: string;
  target: string;
  cardinality: "1:N" | "N:1" | "1:1" | "N:N";
}

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  group: string;
  summary: string;
  controller: string;
  auth: "Required" | "Public";
  request?: string;
  response?: string;
  handler?: string;
  file?: string;
  line?: number;
  controllerFile?: string;
  serviceFile?: string;
  modelFile?: string;
  middleware?: string[];
  statuses: { code: number; text: string }[];
}

export interface Insight {
  index: string;
  title: string;
  body: string;
  meta: { label: string; value: string }[];
  tone: StatusTone;
  trace?: string[];
  provider?: string;
}

export interface AskAnswer {
  question: string;
  summary: string;
  trace: { path: string; line: number; note: string }[];
  snippet?: { path: string; code: string };
  related: string[];
  provider?: string;
}

export interface SearchItem {
  group: "Files" | "APIs" | "Classes" | "Insights" | "Pages";
  label: string;
  detail: string;
  to: string;
}

export interface AnalysisStep {
  id: string;
  label: string;
  detail: string;
}