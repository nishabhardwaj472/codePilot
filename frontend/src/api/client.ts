/**
 * Transport layer for CodePilot API calls.
 */
const rawEnvUrl =
  (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:5000/api";
const cleanEnvUrl = rawEnvUrl.trim().replace(/\/+$/, "");

/**
 * Standardized API Base URL. Guarantees `/api` prefix without duplicate trailing slashes.
 * e.g., `https://codepilot-4n35.onrender.com/api`
 */
export const API_BASE = cleanEnvUrl.endsWith("/api") ? cleanEnvUrl : `${cleanEnvUrl}/api`;

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
 * Constructs the normalized absolute API URL given a subpath.
 * Eliminates duplicate `/api/` prefixes if present.
 */
export function buildApiUrl(path: string): string {
  const resolved = resolveProjectPath(path);
  const normalizedPath = resolved.startsWith("/api/") ? resolved.slice(4) : resolved;
  return `${API_BASE}${normalizedPath}`;
}

/**
 * Executes real API request to Express backend.
 */
export async function request<T>(
  path: string,
  fallbackData: T,
  propertyKey?: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const url = buildApiUrl(path);
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      console.warn(`[CodePilot API Warning] GET ${url} returned HTTP ${res.status}`);
      return fallbackData;
    }

    const json = await res.json();
    if (json.success === false) {
      console.warn(
        `[CodePilot API Warning] GET ${url} returned success: false - ${json.error || "Unknown error"}`,
      );
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[CodePilot API Error] Fetch failed for ${path}:`, message);
    return fallbackData;
  }
}

/**
 * Uploads FormData (e.g. multipart ZIP file) to the backend.
 * Browser automatically sets the multipart boundary header.
 */
export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const url = buildApiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new Error(`Failed to connect to CodePilot backend (${url}): ${message}`);
  }

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Upload failed with HTTP ${response.status}`);
  }

  return json as T;
}

/**
 * Standard POST helper for JSON API requests
 */
export async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = buildApiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new Error(`Failed to connect to CodePilot backend (${url}): ${message}`);
  }

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Request failed with HTTP ${response.status}`);
  }

  return json as T;
}
