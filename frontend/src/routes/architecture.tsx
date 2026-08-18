import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Edge, Node } from "@xyflow/react";
import { AppShell } from "@/components/workspace/AppShell";
import { DiagramCanvas } from "@/components/diagram/DiagramCanvas";
import {
  InspectorList,
  InspectorPanel,
  InspectorStat,
} from "@/components/workspace/InspectorPanel";
import { getArchitecture } from "@/api/analysis";
import { archEdges as fallbackEdges, archLayout as fallbackLayout, archModules as fallbackModules } from "@/mock/architecture";
import type { ArchEdge, ArchModule } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture Map — CodePilot" },
      {
        name: "description",
        content:
          "Interactive software architecture canvas showing developer groups, modules and request data flow.",
      },
      { property: "og:title", content: "Architecture Map — CodePilot" },
      {
        property: "og:description",
        content: "Developer-oriented software architecture, module boundaries and data flow.",
      },
    ],
  }),
  component: ArchitecturePage,
});

const views = [
  { id: "overview", label: "Overview" },
  { id: "modules", label: "Modules" },
  { id: "dataflow", label: "Data Flow" },
] as const;

function ArchitecturePage() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("overview");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  const [modulesList, setModulesList] = useState<ArchModule[]>(fallbackModules);
  const [edgesList, setEdgesList] = useState<ArchEdge[]>(fallbackEdges);
  const [layoutMap, setLayoutMap] = useState<Record<string, { x: number; y: number }>>(fallbackLayout);

  useEffect(() => {
    let mounted = true;
    getArchitecture().then((res) => {
      if (mounted && res) {
        if (Array.isArray(res.modules) && res.modules.length > 0) setModulesList(res.modules);
        if (Array.isArray(res.edges) && res.edges.length > 0) setEdgesList(res.edges);
        if (res.layout && Object.keys(res.layout).length > 0) setLayoutMap(res.layout);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const currentViewModules = useMemo(
    () => modulesList.filter((m) => !m.group || m.group === view),
    [modulesList, view]
  );

  const layers = useMemo(
    () => ["All", ...Array.from(new Set(currentViewModules.map((m) => m.layer)))],
    [currentViewModules],
  );

  const nodes: Node[] = useMemo(
    () =>
      currentViewModules
        .filter((m) => filter === "All" || m.layer === filter)
        .map((m) => ({
          id: m.id,
          type: "arch",
          position: layoutMap[m.id] ?? { x: 50, y: 50 },
          data: { label: m.label, layer: m.layer, files: m.files, tech: m.tech, status: m.status },
          selected: selected === m.id,
        })),
    [currentViewModules, filter, selected, layoutMap],
  );

  const edges: Edge[] = useMemo(
    () =>
      edgesList
        .filter((e) => !e.group || e.group === view)
        .filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target))
        .map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          style: { stroke: "var(--grid)" },
          labelStyle: { fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)", fontSize: 10 },
          labelBgStyle: { fill: "var(--background)" },
        })),
    [view, nodes, edgesList],
  );

  const module = currentViewModules.find((m) => m.id === selected) || modulesList.find((m) => m.id === selected);

  return (
    <AppShell breadcrumb={["medchain", "architecture", view]}>
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-4 border-b border-border bg-surface px-4 py-2">
          <h1 className="text-[14px] font-medium text-foreground">Software Architecture</h1>
          <div className="flex border border-border">
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setView(v.id);
                  setSelected(null);
                }}
                className={cn(
                  "h-7 px-3 font-mono text-[11px] transition-colors cursor-pointer",
                  view === v.id
                    ? "bg-surface-raised text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2">
            <span className="mono-label">Filter Layer</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-7 border border-border bg-background px-2 font-mono text-[11px] text-foreground outline-none cursor-pointer"
            >
              {layers.map((layer) => (
                <option key={layer}>{layer}</option>
              ))}
            </select>
          </label>

          <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
            {nodes.length} modules · {edges.length} connections
          </span>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <DiagramCanvas
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => setSelected(node.id)}
            onPaneClick={() => setSelected(null)}
            onReset={() => setSelected(null)}
            legend={
              <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-ok" />active layer
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-info" />data pipeline
                </span>
              </div>
            }
          />

          <InspectorPanel
            className="hidden lg:flex"
            {...(module ? { title: module.label, subtitle: `${module.layer} · ${module.tech}` } : {})}
            empty="Select an architecture node on the canvas to inspect its source files, responsibilities and dependency metrics."
          >
            {module ? (
              <>
                <InspectorStat label="Files" value={module.files} />
                <InspectorStat label="Incoming Connections" value={module.dependents || 0} />
                <InspectorStat label="Outgoing Dependencies" value={module.dependencies || 0} />
                <InspectorList label="Responsibilities" items={module.responsibilities || []} />
                <InspectorList label="Files in Category" items={module.fileList || []} />
              </>
            ) : null}
          </InspectorPanel>
        </div>
      </div>
    </AppShell>
  );
}