import { request } from "./client";
import { archEdges, archLayout, archModules } from "@/mock/architecture";
import { dependencyEdges, dependencyNodes } from "@/mock/dependencies";
import { dbRelations, dbTables } from "@/mock/database";
import { apiEndpoints } from "@/mock/apis";
import { getCode, getIntelligence } from "@/mock/code";
import type {
  AnalysisStep,
  ApiEndpoint,
  ArchEdge,
  ArchModule,
  DbRelation,
  DbTable,
  DependencyNode,
} from "@/types";

export function getArchitecture(): Promise<{
  modules: ArchModule[];
  edges: ArchEdge[];
  layout: Record<string, { x: number; y: number }>;
}> {
  return request("/projects/:projectId/architecture", {
    modules: archModules,
    edges: archEdges,
    layout: archLayout,
  });
}

export function getDependencies(): Promise<{
  nodes: DependencyNode[];
  edges: { source: string; target: string }[];
}> {
  return request("/projects/:projectId/dependencies", {
    nodes: dependencyNodes,
    edges: dependencyEdges,
  });
}

export function getDatabaseSchema(): Promise<{ tables: DbTable[]; relations: DbRelation[] }> {
  return request("/projects/:projectId/database", {
    tables: dbTables,
    relations: dbRelations,
  });
}

export function getApiEndpoints(): Promise<ApiEndpoint[]> {
  return request("/projects/:projectId/apis", apiEndpoints);
}

export function getFileSource(path: string) {
  return request(`/projects/:projectId/source?path=${encodeURIComponent(path)}`, {
    path,
    code: getCode(path),
    intelligence: getIntelligence(path),
  });
}

export const analysisSteps: AnalysisStep[] = [
  { id: "structure", label: "Reading project structure", detail: "Scanning files & directories" },
  { id: "languages", label: "Detecting languages", detail: "AST & extension parsing" },
  { id: "graph", label: "Building dependency graph", detail: "Import & export tracing" },
  { id: "architecture", label: "Mapping architecture", detail: "Layer & module synthesis" },
  { id: "insights", label: "Preparing AI insights", detail: "Codebase intelligence indexing" },
];