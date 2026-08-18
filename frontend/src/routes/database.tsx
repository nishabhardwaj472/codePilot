import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Edge, Node } from "@xyflow/react";
import { AppShell } from "@/components/workspace/AppShell";
import { DiagramCanvas } from "@/components/diagram/DiagramCanvas";
import { InspectorList, InspectorPanel, InspectorStat } from "@/components/workspace/InspectorPanel";
import { getDatabaseSchema } from "@/api/analysis";
import { dbRelations as fallbackRelations, dbTables as fallbackTables } from "@/mock/database";
import type { DbRelation, DbTable } from "@/types";

export const Route = createFileRoute("/database")({
  head: () => ({
    meta: [
      { title: "Data Model — CodePilot" },
      {
        name: "description",
        content:
          "Entity relationship diagram of the repository collections, fields, keys and relation cardinalities.",
      },
      { property: "og:title", content: "Data Model — CodePilot" },
      {
        property: "og:description",
        content: "Collections, fields and relations rendered as an interactive ER diagram.",
      },
    ],
  }),
  component: DatabasePage,
});

function DatabasePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tablesList, setTablesList] = useState<DbTable[]>(fallbackTables);
  const [relationsList, setRelationsList] = useState<DbRelation[]>(fallbackRelations);

  useEffect(() => {
    let mounted = true;
    getDatabaseSchema().then((res) => {
      if (mounted && res) {
        if (Array.isArray(res.tables) && res.tables.length > 0) setTablesList(res.tables);
        if (Array.isArray(res.relations) && res.relations.length > 0) setRelationsList(res.relations);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const nodes: Node[] = useMemo(
    () =>
      tablesList.map((t, idx) => ({
        id: t.id,
        type: "table",
        position: { x: t.x ?? (idx % 3) * 280 + 40, y: Math.floor(idx / 3) * 240 + 40 },
        data: { name: t.name, collection: t.collection, rows: t.rows, columns: t.columns },
        selected: selected === t.id,
      })),
    [tablesList, selected],
  );

  const edges: Edge[] = useMemo(
    () =>
      relationsList.map((r) => ({
        id: r.id,
        source: r.source,
        target: r.target,
        label: r.cardinality,
        style: { stroke: "var(--grid)" },
        labelStyle: { fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)", fontSize: 10 },
        labelBgStyle: { fill: "var(--background)" },
      })),
    [relationsList],
  );

  const table = tablesList.find((t) => t.id === selected);

  return (
    <AppShell breadcrumb={["medchain", "database"]}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b border-border bg-surface px-4 py-2">
          <h1 className="text-[14px] font-medium text-foreground">Data Model</h1>
          <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
            {tablesList.length} collections · {relationsList.length} relations
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
            {...(table ? { title: table.name, subtitle: table.collection } : {})}
            empty="Select a collection to inspect its fields."
          >
            {table ? (
              <>
                <InspectorStat label="Documents" value={table.rows} />
                <InspectorStat label="Fields" value={table.columns.length} />
                <InspectorList
                  label="Fields"
                  items={table.columns.map(
                    (c) => `${c.name}: ${c.type}${c.key ? ` (${c.key})` : ""}`,
                  )}
                />
              </>
            ) : null}
          </InspectorPanel>
        </div>
      </div>
    </AppShell>
  );
}