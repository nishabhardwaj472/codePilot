import { cn } from "@/lib/utils";

export function InspectorPanel({
  title,
  subtitle,
  children,
  empty,
  className,
}: {
  title?: string | undefined;
  subtitle?: string | undefined;
  children?: React.ReactNode;
  empty?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <aside className={cn("flex h-full flex-col border-l border-border bg-surface", className)}>
      <div className="flex h-10 shrink-0 items-center border-b border-border px-4">
        <span className="mono-label text-foreground/70">Inspector</span>
      </div>
      {title ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-border px-4 py-3">
            <div className="font-mono text-[12.5px] tracking-wide text-primary uppercase">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          {children}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            {empty ?? "Select a node to inspect it."}
          </p>
        </div>
      )}
    </aside>
  );
}

export function InspectorStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-border px-4 py-2.5">
      <div className="mono-label">{label}</div>
      <div className="mt-1 font-mono text-[15px] text-foreground tabular-nums">{value}</div>
    </div>
  );
}

export function InspectorList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="mono-label pb-2">{label}</div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 font-mono text-[11.5px] text-foreground/85">
            <span className="text-primary">•</span>
            <span className="min-w-0 break-all">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}