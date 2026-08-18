import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/workspace/StatusBadge";
import type { DbColumn, StatusTone } from "@/types";

export interface ArchNodeData extends Record<string, unknown> {
  label: string;
  layer: string;
  files: number;
  tech: string;
  status: StatusTone;
}

export function ArchitectureNode({ data, selected }: NodeProps) {
  const d = data as ArchNodeData;
  return (
    <div
      className={cn(
        "w-[240px] border bg-surface transition-all duration-150",
        selected
          ? "border-primary shadow-[0_0_0_1px_var(--primary),0_10px_30px_-12px_rgba(0,0,0,0.9)]"
          : "border-border hover:border-input",
      )}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="mono-label">{d.layer}</span>
        <StatusDot tone={d.status} pulse={d.status === "warn" || d.status === "danger"} />
      </div>
      <div className="px-3 py-2.5">
        <div className="truncate text-[13.5px] font-medium text-foreground">{d.label}</div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[10.5px] text-muted-foreground">
          <span className="truncate">{d.tech}</span>
          <span className="tabular-nums">{d.files} files</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export interface DepNodeData extends Record<string, unknown> {
  file: string;
  kind: string;
  complexity: string;
  highlight: "none" | "selected" | "imports" | "importedBy" | "dim";
}

export function DependencyGraphNode({ data }: NodeProps) {
  const d = data as DepNodeData;
  const ring =
    d.highlight === "selected"
      ? "border-primary text-foreground bg-surface-raised"
      : d.highlight === "imports"
        ? "border-info/60 text-foreground"
        : d.highlight === "importedBy"
          ? "border-ok/60 text-foreground"
          : d.highlight === "dim"
            ? "border-border/60 opacity-35"
            : "border-border";
  return (
    <div className={cn("w-[196px] border bg-surface transition-all duration-200", ring)}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 px-2.5 py-2">
        <span
          className={cn(
            "size-1.5 shrink-0",
            d.complexity === "High"
              ? "bg-danger"
              : d.complexity === "Medium"
                ? "bg-warn"
                : "bg-ok",
          )}
        />
        <span className="truncate font-mono text-[11.5px] text-foreground">{d.file}</span>
      </div>
      <div className="border-t border-border px-2.5 py-1">
        <span className="mono-label">{d.kind}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export interface TableNodeData extends Record<string, unknown> {
  name: string;
  collection: string;
  rows: string;
  columns: DbColumn[];
  dim: boolean;
}

export function TableNode({ data, selected }: NodeProps) {
  const d = data as TableNodeData;
  return (
    <div
      className={cn(
        "w-[228px] border bg-surface transition-all duration-150",
        selected ? "border-primary" : "border-border hover:border-input",
        d.dim && "opacity-30",
      )}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-3 py-1.5">
        <span className="font-mono text-[11.5px] font-semibold tracking-wide text-primary">
          {d.name}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{d.rows}</span>
      </div>
      <div className="divide-y divide-border/70">
        {d.columns.map((column) => (
          <div key={column.name} className="flex items-center gap-2 px-3 py-[5px]">
            <span
              className={cn(
                "w-[18px] shrink-0 font-mono text-[9px] tracking-wider",
                column.key === "pk"
                  ? "text-primary"
                  : column.key === "fk"
                    ? "text-info"
                    : "text-transparent",
              )}
            >
              {column.key === "pk" ? "PK" : column.key === "fk" ? "FK" : "—"}
            </span>
            <span className="flex-1 truncate font-mono text-[11px] text-foreground/90">
              {column.name}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{column.type}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const nodeTypes = {
  arch: ArchitectureNode,
  dep: DependencyGraphNode,
  table: TableNode,
};