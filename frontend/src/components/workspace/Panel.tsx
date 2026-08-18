import { cn } from "@/lib/utils";

export function Panel({
  title,
  meta,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  meta?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      <header className="flex h-10 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <h2 className="mono-label text-foreground/80">{title}</h2>
          {meta ? <span className="font-mono text-[10.5px] text-muted-foreground">{meta}</span> : null}
        </div>
        {actions}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}