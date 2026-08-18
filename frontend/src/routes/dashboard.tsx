import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/workspace/AppShell";
import { RepositoryHeader } from "@/components/workspace/RepositoryHeader";
import { Metric, ScoreBar } from "@/components/workspace/Metric";
import { Panel } from "@/components/workspace/Panel";
import { FileTree } from "@/components/workspace/FileTree";
import { StatusDot } from "@/components/workspace/StatusBadge";
import { getCurrentProject, getFileTree, getHealth, getMetrics, getTimeline } from "@/api/projects";
import { fileTree as fallbackTree, health as fallbackHealth, metrics as fallbackMetrics, project as fallbackProject, timeline as fallbackTimeline } from "@/mock/project";
import type { FileNode, HealthScore, MetricEntry, Project, TimelineEvent } from "@/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Codebase Overview — CodePilot" },
      {
        name: "description",
        content:
          "Repository overview: file counts, repository health scores, technology stack and recent analysis events.",
      },
      { property: "og:title", content: "Codebase Overview — CodePilot" },
      {
        property: "og:description",
        content: "Information-dense repository overview with health scoring and analysis timeline.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [projectData, setProjectData] = useState<Project>(fallbackProject);
  const [metricList, setMetricList] = useState<MetricEntry[]>(fallbackMetrics);
  const [healthScores, setHealthScores] = useState<HealthScore[]>(fallbackHealth);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(fallbackTimeline);
  const [treeNodes, setTreeNodes] = useState<FileNode[]>(fallbackTree);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [proj, mList, hScores, tEvents, tree] = await Promise.all([
        getCurrentProject(),
        getMetrics(),
        getHealth(),
        getTimeline(),
        getFileTree(),
      ]);

      if (mounted) {
        if (proj && proj.name) setProjectData(proj);
        if (Array.isArray(mList) && mList.length > 0) setMetricList(mList);
        if (Array.isArray(hScores) && hScores.length > 0) setHealthScores(hScores);
        if (Array.isArray(tEvents) && tEvents.length > 0) setTimelineEvents(tEvents);
        if (Array.isArray(tree) && tree.length > 0) setTreeNodes(tree);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell breadcrumb={[projectData.name.toLowerCase(), "overview"]}>
      <div className="h-full overflow-y-auto">
        <RepositoryHeader project={projectData} />

        <div className="grid grid-cols-2 border-b border-border bg-surface md:grid-cols-3 xl:grid-cols-5">
          {metricList.map((metric) => (
            <Metric
              key={metric.label}
              label={metric.label}
              value={metric.value}
              {...(metric.hint ? { hint: metric.hint } : {})}
            />
          ))}
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Panel title="Repository Health" meta="weighted · 0–100">
              {healthScores.map((item) => (
                <ScoreBar key={item.label} {...item} />
              ))}
            </Panel>

            <Panel title="Technology Stack" meta={`${projectData.stack?.length || 0} detected`}>
              <div className="flex flex-wrap gap-px bg-border p-px">
                {(projectData.stack || ["JavaScript"]).map((tech) => (
                  <span
                    key={tech}
                    className="bg-surface px-3 py-2 font-mono text-[11.5px] text-foreground/85"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Project Structure" meta={`${projectData.fileCount || 0} files`}>
              <div className="max-h-[420px] overflow-y-auto">
                <FileTree nodes={treeNodes} />
              </div>
            </Panel>
          </div>

          <Panel title="Recent Analysis" meta="live index">
            <ol>
              {timelineEvents.map((event) => (
                <li
                  key={event.time + event.label}
                  className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="pt-[5px]">
                    <StatusDot tone={event.tone} />
                  </span>
                  <span className="font-mono text-[11.5px] text-muted-foreground tabular-nums">
                    {event.time}
                  </span>
                  <span className="flex-1 text-[12.5px] leading-relaxed text-foreground/90">
                    {event.label}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}