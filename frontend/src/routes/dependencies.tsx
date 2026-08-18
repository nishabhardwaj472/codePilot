import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Edge, Node } from "@xyflow/react";
import { AppShell } from "@/components/workspace/AppShell";
import { DiagramCanvas } from "@/components/diagram/DiagramCanvas";
import { InspectorList, InspectorPanel, InspectorStat } from "@/components/workspace/InspectorPanel";
import { getDependencies } from "@/api/analysis";
import { dependencyEdges as fallbackEdges, dependencyNodes as fallbackNodes } from "@/mock/dependencies";
import type { DependencyNode } from "@/types";

export const Route = createFileRoute("/dependencies")({
  head: () => ({
    meta: [
      { title: "Dependency Graph — CodePilot" },
      {
        name: "description",
        content:
          "File-level import graph with circular dependency detection and per-file fan-in / fan-out counts.",
      },
      { property: "og:title", content: "Dependency Graph — CodePilot" },
      {
        property: "og:description",
        content: "Trace imports, importers and dependency cycles across the repository.",
      },
    ],
  }),
  component: DependenciesPage,
});

function DependenciesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [nodesList, setNodesList] = useState<DependencyNode[]>(fallbackNodes);
  const [edgesList, setEdgesList] = useState<{ source: string; target: string }[]>(fallbackEdges);

  useEffect(() => {
    let mounted = true;
    getDependencies().then((res) => {
      if (mounted && res) {
        if (Array.isArray(res.nodes) && res.nodes.length > 0) setNodesList(res.nodes);
        if (Array.isArray(res.edges) && res.edges.length > 0) setEdgesList(res.edges);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const nodes: Node[] = useMemo(
    () =>
      nodesList.map((n, idx) => ({
        id: n.id,
        type: "dep",
        position: { x: n.x ?? (idx % 4) * 220 + 40, y: Math.floor(idx / 4) * 160 + 40 },
        data: { file: n.file, kind: n.kind, circular: n.circular, complexity: n.complexity },
        selected: selected === n.id,
      })),
    [nodesList, selected],
  );

  const edges: Edge[] = useMemo(
    () =>
      edgesList.map((e, i) => {
        const active = selected === e.source || selected === e.target;
        return {
          id: `dep-${i}`,
          source: e.source,
          target: e.target,
          animated: active,
          style: { stroke: active ? "var(--primary)" : "var(--grid)", strokeWidth: active ? 1.6 : 1 },
        };
      }),
    [edgesList, selected],
  );

  const file = nodesList.find((n) => n.id === selected);

  return (
    <AppShell breadcrumb={["medchain", "dependencies"]}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b border-border bg-surface px-4 py-2">
          <h1 className="text-[14px] font-medium text-foreground">Dependency Graph</h1>
          <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
            {nodes.length} files · {edges.length} imports
          </span>
        </div>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_300px]">
          <DiagramCanvas
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => setSelected(node.id)}
            onPaneClick={() => setSelected(null)}
            onReset={() => setSelected(null)}
          />
          <InspectorPanel
            className="hidden lg:flex"
            {...(file ? { title: file.file, subtitle: file.path } : {})}
            empty="Select a file to highlight its import edges."
          >
            {file ? (
              <>
                <InspectorStat label="Kind" value={file.kind} />
                <InspectorStat label="Complexity" value={file.complexity} />
                <InspectorStat label="Cycles" value={file.circular} />
                <InspectorList label="Imports" items={file.imports} />
                <InspectorList label="Imported by" items={file.importedBy} />
              </>
            ) : null}
          </InspectorPanel>
        </div>
      </div>
    </AppShell>
  );
}