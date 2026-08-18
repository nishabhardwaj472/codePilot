import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="shrink-0">
        <rect x="0.5" y="0.5" width="19" height="19" fill="none" stroke="var(--grid)" />
        <path d="M5 6.5 L8 10 L5 13.5" fill="none" stroke="var(--primary)" strokeWidth="1.6" />
        <path d="M10.5 13.5 H15" fill="none" stroke="var(--foreground)" strokeWidth="1.6" />
      </svg>
      {showText ? (
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          Code<span className="text-primary">Pilot</span>
        </span>
      ) : null}
    </span>
  );
}