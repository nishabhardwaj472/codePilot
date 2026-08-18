import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  Braces,
  Database,
  FileCode2,
  GitBranch,
  LayoutPanelLeft,
  MessagesSquare,
  Network,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { getCurrentProject } from "@/api/projects";
import { project as fallbackProject } from "@/mock/project";
import type { Project } from "@/types";

const groups: {
  title: string;
  items: { label: string; to: string; icon: React.ElementType; badge?: string }[];
}[] = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", to: "/dashboard", icon: LayoutPanelLeft },
      { label: "Architecture", to: "/architecture", icon: Boxes },
      { label: "Dependencies", to: "/dependencies", icon: Network },
      { label: "Database", to: "/database", icon: Database },
      { label: "APIs", to: "/apis", icon: Braces },
      { label: "Files", to: "/files", icon: FileCode2 },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "AI Insights", to: "/insights", icon: Sparkles },
      { label: "Ask CodePilot", to: "/ask", icon: MessagesSquare },
    ],
  },
  {
    title: "Project",
    items: [{ label: "Settings", to: "/settings", icon: Settings }],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeProject, setActiveProject] = useState<Project>(fallbackProject);

  useEffect(() => {
    let mounted = true;
    getCurrentProject().then((p) => {
      if (mounted && p && p.name) {
        setActiveProject(p);
      }
    });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link to="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="mono-label px-4 pb-1.5">{group.title}</div>
            {group.items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex h-8 items-center gap-2.5 px-4 text-[13px] transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute top-0 left-0 h-full w-[2px] bg-primary" />
                  ) : null}
                  <item.icon
                    className={cn("size-[15px] shrink-0", active ? "text-primary" : "opacity-70")}
                    strokeWidth={1.6}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border">
        <div className="px-4 py-3">
          <div className="mono-label pb-1.5">Current Project</div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-ok" />
            <span className="truncate text-[13px] font-medium text-foreground">
              {activeProject.name}
            </span>
          </div>
          <div className="mt-1 truncate font-mono text-[10.5px] text-muted-foreground">
            {activeProject.repoUrl || `local://${activeProject.name}`}
          </div>
          <div className="mt-2 flex items-center gap-3 font-mono text-[10.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitBranch className="size-3" strokeWidth={1.6} />
              {activeProject.branch || "main"}
            </span>
            <span className="flex items-center gap-1">
              <Star className="size-3" strokeWidth={1.6} />
              1.2k
            </span>
            <span>{activeProject.fileCount || 0} files</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-2.5">
          <span className="flex size-6 items-center justify-center border border-border bg-surface-raised font-mono text-[10px] text-primary">
            CP
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] text-foreground">CodePilot Workspace</div>
            <div className="truncate font-mono text-[10px] text-muted-foreground">
              codebase intelligence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}