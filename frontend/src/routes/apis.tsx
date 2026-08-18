import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/workspace/AppShell";
import { MethodTag, StatusBadge } from "@/components/workspace/StatusBadge";
import { InspectorList, InspectorPanel, InspectorStat } from "@/components/workspace/InspectorPanel";
import { getApiEndpoints } from "@/api/analysis";
import { apiEndpoints as fallbackApis } from "@/mock/apis";
import type { ApiEndpoint } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apis")({
  head: () => ({
    meta: [
      { title: "API Explorer — CodePilot" },
      {
        name: "description",
        content:
          "Browse detected Express routes: HTTP method, path, handler, controller, service, model and line locations.",
      },
      { property: "og:title", content: "API Explorer — CodePilot" },
      {
        property: "og:description",
        content: "Detected endpoints with handler names, source files and traced data flow.",
      },
    ],
  }),
  component: ApisPage,
});

const methodFilters = ["All", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function ApisPage() {
  const [endpointsList, setEndpointsList] = useState<ApiEndpoint[]>(fallbackApis);
  const [selectedId, setSelectedId] = useState<string>(fallbackApis[0]?.id || "api-1");
  const [methodFilter, setMethodFilter] = useState<(typeof methodFilters)[number]>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    getApiEndpoints().then((res) => {
      if (mounted && Array.isArray(res) && res.length > 0) {
        setEndpointsList(res);
        if (res[0]?.id) setSelectedId(res[0].id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      endpointsList
        .filter((e) => methodFilter === "All" || e.method.toUpperCase() === methodFilter)
        .filter((e) => {
          const q = query.toLowerCase();
          return (
            e.path.toLowerCase().includes(q) ||
            (e.handler && e.handler.toLowerCase().includes(q)) ||
            (e.file && e.file.toLowerCase().includes(q)) ||
            (e.controller && e.controller.toLowerCase().includes(q)) ||
            e.method.toLowerCase().includes(q)
          );
        }),
    [endpointsList, methodFilter, query],
  );

  const endpoint = endpointsList.find((e) => e.id === selectedId) ?? filtered[0] ?? endpointsList[0];

  return (
    <AppShell breadcrumb={["medchain", "apis"]}>
      <div className="grid h-full lg:grid-cols-[360px_minmax(0,1fr)_320px]">
        {/* Left Column: Endpoints List & Filter */}
        <div className="flex min-h-0 flex-col border-b border-border lg:border-r lg:border-b-0">
          <div className="space-y-2.5 border-b border-border p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search endpoints, handlers, files…"
              className="h-8 w-full border border-border bg-background px-2.5 font-mono text-[11.5px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/60"
            />
            <div className="flex flex-wrap border border-border bg-background">
              {methodFilters.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={cn(
                    "h-6 flex-1 px-1.5 font-mono text-[10px] uppercase transition-colors cursor-pointer",
                    methodFilter === m
                      ? "bg-surface-raised font-bold text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center font-mono text-[12px] text-muted-foreground">
                No routes matched filters
              </div>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-border p-3 text-left transition-colors hover:bg-surface cursor-pointer",
                    e.id === endpoint?.id && "bg-surface-raised",
                  )}
                >
                  <MethodTag method={e.method} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-[12px] font-medium text-foreground">
                      {e.path}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between font-mono text-[10.5px] text-muted-foreground">
                      <span className="truncate text-primary/90">{e.handler || "handler"}</span>
                      <span className="truncate">{e.file ? `${e.file.split("/").pop()}:${e.line || 1}` : e.controller}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center Column: Route Specification & Data Flow */}
        <div className="min-h-0 overflow-y-auto border-b border-border lg:border-r lg:border-b-0">
          {endpoint ? (
            <>
              <div className="border-b border-border bg-surface px-6 py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <MethodTag method={endpoint.method} />
                  <h1 className="font-mono text-[16px] font-semibold text-foreground">{endpoint.path}</h1>
                  <StatusBadge tone={endpoint.auth === "Required" ? "warn" : "ok"}>
                    auth {endpoint.auth.toLowerCase()}
                  </StatusBadge>
                </div>
                <p className="mt-2.5 text-[13px] text-muted-foreground">
                  {endpoint.summary || `${endpoint.method} handler for ${endpoint.path}`}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
                  <span>Handler: <strong className="text-primary">{endpoint.handler || "anonymous"}</strong></span>
                  <span>Location: <strong className="text-foreground">{endpoint.file || endpoint.controller}:{endpoint.line || 1}</strong></span>
                </div>
              </div>

              {/* Traced Architecture Execution Path */}
              <div className="border-b border-border p-5">
                <div className="mono-label mb-3 text-primary">Architecture Execution Flow</div>
                <div className="space-y-2 border border-border bg-surface p-4 font-mono text-[11.5px]">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-muted-foreground">1. Route:</span>
                    <span className="truncate font-medium text-foreground">{endpoint.file || endpoint.controller}:{endpoint.line || 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-muted-foreground">2. Handler:</span>
                    <span className="truncate font-medium text-primary">{endpoint.handler || "handler"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-muted-foreground">3. Controller:</span>
                    <span className="truncate text-foreground">{endpoint.controllerFile || endpoint.controller}</span>
                  </div>
                  {endpoint.serviceFile ? (
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-muted-foreground">4. Service:</span>
                      <span className="truncate text-foreground">{endpoint.serviceFile}</span>
                    </div>
                  ) : null}
                  {endpoint.modelFile ? (
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-muted-foreground">5. Model:</span>
                      <span className="truncate text-ok">{endpoint.modelFile}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-muted-foreground">6. Storage:</span>
                    <span className="truncate text-muted-foreground">MongoDB Database Collection</span>
                  </div>
                </div>
              </div>

              {/* HTTP Status Codes */}
              <div className="p-5">
                <div className="mono-label mb-3">HTTP Status Codes</div>
                <div className="border border-border">
                  {(endpoint.statuses || []).map((s) => (
                    <div
                      key={s.code}
                      className="flex items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0"
                    >
                      <span className="font-mono text-[12px] font-medium text-primary tabular-nums">
                        {s.code}
                      </span>
                      <span className="text-[12.5px] text-muted-foreground">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center font-mono text-[13px] text-muted-foreground">
              Select an API endpoint to inspect details
            </div>
          )}
        </div>

        {/* Right Inspector Panel */}
        <InspectorPanel
          className="hidden lg:flex"
          {...(endpoint ? { title: `${endpoint.method} ${endpoint.path}`, subtitle: `Handler: ${endpoint.handler || "anonymous"}` } : {})}
          empty="Select an endpoint to inspect."
        >
          {endpoint ? (
            <>
              <InspectorStat label="Method" value={endpoint.method} />
              <InspectorStat label="Auth" value={endpoint.auth} />
              <InspectorStat label="Source File" value={endpoint.file ? `${endpoint.file.split("/").pop()}:${endpoint.line || 1}` : endpoint.controller} />
              <InspectorStat label="Controller" value={endpoint.controllerFile ? (endpoint.controllerFile.split("/").pop() || "") : endpoint.controller} />
              {endpoint.serviceFile ? <InspectorStat label="Service" value={endpoint.serviceFile.split("/").pop() || ""} /> : null}
              {endpoint.modelFile ? <InspectorStat label="Model" value={endpoint.modelFile.split("/").pop() || ""} /> : null}
              <InspectorList label="Middleware" items={endpoint.middleware && endpoint.middleware.length > 0 ? endpoint.middleware : ["express.json()", "cors()"]} />
            </>
          ) : null}
        </InspectorPanel>
      </div>
    </AppShell>
  );
}