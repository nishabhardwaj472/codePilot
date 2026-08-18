import { cn } from "@/lib/utils";
import type { StatusTone } from "@/types";

const toneClass: Record<StatusTone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-info",
  idle: "text-muted-foreground",
};

export function StatusDot({ tone, pulse }: { tone: StatusTone; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-[6px] shrink-0 rounded-full bg-current",
        toneClass[tone],
        pulse && "animate-dot",
      )}
    />
  );
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-border bg-surface-raised px-2 py-[3px] font-mono text-[10.5px] tracking-wide uppercase",
        toneClass[tone],
        className,
      )}
    >
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}

const methodTone: Record<string, string> = {
  GET: "text-info border-info/40",
  POST: "text-ok border-ok/40",
  PUT: "text-warn border-warn/40",
  PATCH: "text-warn border-warn/40",
  DELETE: "text-danger border-danger/40",
};

export function MethodTag({ method, className }: { method: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-[52px] justify-center border bg-background px-1 py-[2px] font-mono text-[10px] font-semibold tracking-wider",
        methodTone[method] ?? "text-muted-foreground border-border",
        className,
      )}
    >
      {method}
    </span>
  );
}