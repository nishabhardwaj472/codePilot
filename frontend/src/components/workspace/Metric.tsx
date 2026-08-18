import { cn } from "@/lib/utils";

export function Metric({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between border-r border-border px-5 py-4 last:border-r-0",
        "transition-colors hover:bg-surface-raised",
        className,
      )}
    >
      <span className="absolute top-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
      <div className="font-mono text-3xl leading-none font-medium tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-3">
        <div className="mono-label">{label}</div>
        {hint ? (
          <div className="mt-1 font-mono text-[10.5px] text-muted-foreground/70">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ScoreBar({ label, score, note }: { label: string; score: number; note: string }) {
  const tone =
    score >= 80 ? "bg-ok" : score >= 65 ? "bg-primary" : score >= 55 ? "bg-warn" : "bg-danger";
  return (
    <div className="group grid grid-cols-[minmax(0,168px)_1fr_auto] items-center gap-4 border-b border-border px-5 py-3 last:border-b-0 hover:bg-surface-raised">
      <div className="truncate text-[13px] text-foreground">{label}</div>
      <div className="relative h-[6px] w-full bg-background">
        <div className="absolute inset-0 flex justify-between">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="h-full w-px bg-grid/60" />
          ))}
        </div>
        <div
          className={cn("relative h-full transition-all duration-700", tone)}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-baseline gap-3">
        <span className="hidden max-w-[280px] truncate font-mono text-[10.5px] text-muted-foreground xl:block">
          {note}
        </span>
        <span className="w-8 text-right font-mono text-[13px] tabular-nums text-foreground">
          {score}
        </span>
      </div>
    </div>
  );
}