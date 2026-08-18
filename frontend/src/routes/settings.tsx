import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/workspace/AppShell";
import { Panel } from "@/components/workspace/Panel";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Workspace Settings — CodePilot" },
      {
        name: "description",
        content: "Workspace preferences for analysis depth, ignored paths and diagram rendering.",
      },
      { property: "og:title", content: "Workspace Settings — CodePilot" },
      { property: "og:description", content: "Analysis depth, ignore rules and diagram defaults." },
    ],
  }),
  component: SettingsPage,
});

const rows = [
  { label: "Analysis depth", value: "Full repository" },
  { label: "Ignored paths", value: "node_modules, dist, .next" },
  { label: "Diagram layout", value: "Auto (layered)" },
  { label: "Insight sensitivity", value: "Balanced" },
  { label: "Backend", value: "Mocked (frontend demo)" },
];

function SettingsPage() {
  return (
    <AppShell breadcrumb={["medchain", "settings"]}>
      <div className="h-full overflow-y-auto p-6">
        <Panel title="Workspace" meta="read-only in demo">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
            >
              <span className="text-[13px] text-muted-foreground">{row.label}</span>
              <span className="font-mono text-[12px] text-foreground">{row.value}</span>
            </div>
          ))}
        </Panel>
      </div>
    </AppShell>
  );
}