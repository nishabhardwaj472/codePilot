import { useState } from "react";
import { ChevronRight, File, FileCode2, FileJson, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/types";

function iconFor(node: FileNode) {
  if (node.type === "dir") return Folder;
  if (node.language === "json") return FileJson;
  if (node.language === "ts" || node.language === "tsx") return FileCode2;
  return File;
}

function Row({
  node,
  depth,
  selected,
  onSelect,
  defaultOpen,
}: {
  node: FileNode;
  depth: number;
  selected?: string | undefined;
  onSelect?: ((node: FileNode) => void) | undefined;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = iconFor(node);
  const isActive = selected === node.path;

  return (
    <div>
      <button
        onClick={() => (node.type === "dir" ? setOpen((o) => !o) : onSelect?.(node))}
        className={cn(
          "group flex h-[26px] w-full items-center gap-1.5 pr-2 text-left transition-colors",
          isActive ? "bg-surface-raised text-foreground" : "hover:bg-surface-raised/60",
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {node.type === "dir" ? (
          <ChevronRight
            className={cn(
              "size-3 shrink-0 text-muted-foreground transition-transform duration-150",
              open && "rotate-90",
            )}
            strokeWidth={2}
          />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <Icon
          className={cn(
            "size-[13px] shrink-0",
            node.type === "dir"
              ? "text-primary/80"
              : isActive
                ? "text-primary"
                : "text-muted-foreground",
          )}
          strokeWidth={1.6}
        />
        <span
          className={cn(
            "truncate font-mono text-[12px]",
            isActive ? "text-foreground" : "text-foreground/80",
          )}
        >
          {node.name}
        </span>
        {node.loc ? (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/60 tabular-nums opacity-0 group-hover:opacity-100">
            {node.loc}
          </span>
        ) : null}
        {node.type === "dir" && node.children ? (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/50 tabular-nums">
            {node.children.length}
          </span>
        ) : null}
      </button>

      {node.type === "dir" && open
        ? node.children?.map((child) => (
            <Row
              key={child.path}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              defaultOpen={depth < 0}
            />
          ))
        : null}
    </div>
  );
}

export function FileTree({
  nodes,
  selected,
  onSelect,
  className,
}: {
  nodes: FileNode[];
  selected?: string | undefined;
  onSelect?: ((node: FileNode) => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("py-1.5", className)}>
      {nodes.map((node) => (
        <Row
          key={node.path}
          node={node}
          depth={0}
          selected={selected}
          onSelect={onSelect}
          defaultOpen
        />
      ))}
    </div>
  );
}