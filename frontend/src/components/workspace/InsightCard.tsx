import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import type { Insight, StatusTone } from "@/types";

const accent: Record<StatusTone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-info",
  idle: "text-muted-foreground",
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="group grid grid-cols-[52px_1fr] border-b border-border last:border-b-0 hover:bg-surface-raised/50">
      <div className="flex flex-col items-center border-r border-border py-4">
        <span className={cn("font-mono text-[13px] tabular-nums", accent[insight.tone])}>
          {insight.index}
        </span>
        <span className={cn("mt-2 h-full w-px", "bg-border")} />
      </div>
      <div className="px-5 py-4">
        <h3 className="text-[14px] font-medium text-foreground">{insight.title}</h3>
        <p className="mt-1.5 max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">
          {insight.body}
        </p>

        {insight.trace ? (
          <div className="mt-3 inline-flex flex-col items-start border border-border bg-background px-3 py-2">
            <span className="font-mono text-[11.5px] text-foreground">{insight.trace[0]}</span>
            <ArrowUpDown className="my-1 ml-6 size-3 text-danger" strokeWidth={1.8} />
            <span className="font-mono text-[11.5px] text-foreground">{insight.trace[1]}</span>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          {insight.meta.map((m) => (
            <span key={m.label} className="font-mono text-[10.5px] text-muted-foreground">
              {m.label}
              <span className="ml-2 text-foreground">{m.value}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}