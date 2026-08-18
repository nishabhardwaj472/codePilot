/**
 * Transport layer for CodePilot API calls.
 */
export const API_BASE =
  (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:5000/api";

const ACTIVE_PROJECT_KEY = "activeProjectId";

export function getActiveProjectId(): string {
  if (typeof window === "undefined") return "current";
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || "current";
}

export function setActiveProjectId(id: string): void {
  if (typeof window !== "undefined" && id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  }
}

/**
 * Resolves path template replacing :projectId or :id with the active project ID.
 */
export function resolveProjectPath(path: string): string {
  const activeId = getActiveProjectId();
  let resolved = path.replace(":projectId", activeId).replace(":id", activeId);
  if (!resolved.startsWith("/")) {
    resolved = `/${resolved}`;
  }
  return resolved;
}

/**
 * Executes real API request to Express backend.
 */
export async function request<T>(
  path: string,
  fallbackData: T,
  propertyKey?: string,
  options?: RequestInit
): Promise<T> {
  try {
    const resolvedPath = resolveProjectPath(path);
    const url = `${API_BASE}${resolvedPath}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      return fallbackData;
    }

    const json = await res.json();
    if (json.success === false) {
      return fallbackData;
    }

    // Explicit property key extraction if specified
    if (propertyKey && json[propertyKey] !== undefined) {
      return json[propertyKey] as T;
    }

    // Extract property payload if wrapped
    if (json.project) return json.project as T;
    if (json.modules && json.edges) return json as T;
    if (json.nodes && json.edges) return json as T;
    if (json.tables && json.relations) return json as T;
    if (json.apis) return json.apis as T;
    if (json.tree) return json.tree as T;
    if (json.metrics) return json.metrics as T;
    if (json.health) return json.health as T;
    if (json.timeline) return json.timeline as T;
    if (json.insights) return json.insights as T;
    if (json.answer) return json.answer as T;
    if (json.results) return json.results as T;
    if (json.code !== undefined) return json as T;

    return (json as T) || fallbackData;
  } catch {
    return fallbackData;
  }
}

/**
 * Uploads FormData (e.g. multipart ZIP file) to the backend.
 * Browser automatically sets the multipart boundary header.
 */
export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const resolvedPath = resolveProjectPath(path);
  const url = `${API_BASE}${resolvedPath}`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Upload failed with status ${response.status}`);
  }

  return json as T;
}

/**
 * Standard POST helper for JSON API requests
 */
export async function postJson<T>(path: string, body: Record<string, any>): Promise<T> {
  const resolvedPath = resolveProjectPath(path);
  const url = `${API_BASE}${resolvedPath}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Request failed with status ${response.status}`);
  }

  return json as T;
}