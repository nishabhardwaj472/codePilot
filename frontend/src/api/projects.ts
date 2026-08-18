import { postJson, request, uploadFile, setActiveProjectId } from "./client";
import { fileTree, health, metrics, project, timeline } from "@/mock/project";
import type { FileNode, HealthScore, MetricEntry, Project, TimelineEvent } from "@/types";

export interface ProjectUploadResponse {
  success: boolean;
  project: Project & {
    directoryCount: number;
    languages: Record<string, number>;
    files: string[];
    fileTree: FileNode[];
    package?: {
      name: string | null;
      version: string;
      dependencies: number;
      devDependencies: number;
      scripts: Record<string, string>;
      packageManager: string;
    } | null;
  };
  error?: string;
}

export async function uploadProjectZip(file: File): Promise<ProjectUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await uploadFile<ProjectUploadResponse>("/projects/upload", formData);
  if (response.success && response.project?.id) {
    setActiveProjectId(response.project.id);
  }
  return response;
}

export async function uploadGitHubRepo(url: string): Promise<ProjectUploadResponse> {
  const response = await postJson<ProjectUploadResponse>("/projects/github", { url });
  if (response.success && response.project?.id) {
    setActiveProjectId(response.project.id);
  }
  return response;
}

export async function uploadPastedStructure(structure: string, name?: string): Promise<ProjectUploadResponse> {
  const response = await postJson<ProjectUploadResponse>("/projects/paste", { structure, name });
  if (response.success && response.project?.id) {
    setActiveProjectId(response.project.id);
  }
  return response;
}

export function getCurrentProject(): Promise<Project> {
  return request("/projects/:projectId", project, "project");
}

export function getMetrics(): Promise<MetricEntry[]> {
  return request("/projects/:projectId/metrics", metrics, "metrics");
}

export function getHealth(): Promise<HealthScore[]> {
  return request("/projects/:projectId/metrics", health, "health");
}

export function getTimeline(): Promise<TimelineEvent[]> {
  return request("/projects/:projectId/metrics", timeline, "timeline");
}

export function getFileTree(): Promise<FileNode[]> {
  return request("/projects/:projectId/tree", fileTree, "tree");
}