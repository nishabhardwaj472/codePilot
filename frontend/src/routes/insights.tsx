import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/workspace/AppShell";
import { Panel } from "@/components/workspace/Panel";
import { InsightCard } from "@/components/workspace/InsightCard";
import { getInsights } from "@/api/ai";
import { issues as fallbackIssues, observations as fallbackObs, patterns as fallbackPatterns, recommendations as fallbackRecs } from "@/mock/insights";
import type { Insight } from "@/types";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Engineering Insights — CodePilot" },
      {
        name: "description",
        content:
          "Audit-style report of observations, issues, detected patterns and prioritised recommendations for the repository.",
      },
      { property: "og:title", content: "Engineering Insights — CodePilot" },
      {
        property: "og:description",
        content: "Observations, issues and recommendations written as an engineering report.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const [obsList, setObsList] = useState<Insight[]>(fallbackObs);
  const [issueList, setIssueList] = useState<Insight[]>(fallbackIssues);
  const [recList, setRecList] = useState<Insight[]>(fallbackRecs);
  const [patternList, setPatternList] = useState<{ name: string; note: string }[]>(fallbackPatterns);
  const [isGemini, setIsGemini] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    getInsights().then((res: any) => {
      if (mounted && res) {
        if (Array.isArray(res.observations) && res.observations.length > 0) {
          setObsList(res.observations);
          setIssueList(res.issues || []);
          setRecList(res.recommendations || []);
          setPatternList(res.patterns || []);
          if (res.observations[0]?.provider === "gemini") {
            setIsGemini(true);
          }
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell breadcrumb={["medchain", "insights"]}>
      <div className="h-full overflow-y-auto">
        <div className="border-b border-border bg-surface px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="mono-label text-primary">report · live analysis</span>
            {isGemini ? (
              <span className="border border-primary/40 px-2 py-0.5 font-mono text-[10px] text-primary">
                REAL GEMINI AI 3.6
              </span>
            ) : (
              <span className="border border-muted-foreground/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                DETERMINISTIC FALLBACK
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
            Engineering Insights
          </h1>
          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-muted-foreground">
            Static analysis & Gemini 3.6 Flash synthesis of structure, dependencies and data access.
          </p>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Panel title="Observations" meta={`${obsList.length} findings`} bodyClassName="p-0">
              {obsList.map((i) => (
                <InsightCard key={i.index} insight={i} />
              ))}
            </Panel>
            {issueList.length > 0 ? (
              <Panel title="Issues" meta={`${issueList.length} flagged`} bodyClassName="p-0">
                {issueList.map((i) => (
                  <InsightCard key={i.index} insight={i} />
                ))}
              </Panel>
            ) : null}
            {recList.length > 0 ? (
              <Panel title="Recommendations" meta="prioritised" bodyClassName="p-0">
                {recList.map((i) => (
                  <InsightCard key={i.index} insight={i} />
                ))}
              </Panel>
            ) : null}
          </div>

          <Panel title="Detected Patterns" meta={`${patternList.length}`}>
            {patternList.map((p) => (
              <div key={p.name} className="border-b border-border px-4 py-3 last:border-b-0">
                <div className="font-mono text-[12px] text-foreground">{p.name}</div>
                <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {p.note}
                </div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}