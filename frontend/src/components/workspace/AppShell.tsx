import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Command, Moon, PanelLeft, RefreshCw, Search, Slash, Sun } from "lucide-react";
import { SidebarContent } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { getCurrentProject } from "@/api/projects";
import { useTheme } from "@/context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-7 items-center gap-1.5 border border-border bg-background px-2.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary/50 cursor-pointer select-none"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="size-3.5 text-primary" strokeWidth={1.8} />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="size-3.5 text-primary" strokeWidth={1.8} />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}

export function AppShell({
  breadcrumb,
  children,
  actions,
}: {
  breadcrumb: string[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projectName, setProjectName] = useState<string>("medchain");

  useEffect(() => {
    let mounted = true;
    getCurrentProject().then((p) => {
      if (mounted && p && p.name) {
        setProjectName(p.name.toLowerCase());
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const displayBreadcrumbs = breadcrumb.map((crumb, idx) =>
    idx === 0 && crumb.toLowerCase() === "medchain" ? projectName : crumb
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-[240px] shrink-0 border-r border-border lg:block">
        <SidebarContent />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-90 lg:hidden">
          <div className="absolute inset-0 bg-background/70" onClick={() => setDrawerOpen(false)} />
          <div className="animate-rise absolute inset-y-0 left-0 w-[260px] border-r border-border">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex size-7 items-center justify-center border border-border text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <PanelLeft className="size-3.5" strokeWidth={1.6} />
          </button>
          <div className="lg:hidden">
            <Logo showText={false} />
          </div>

          <nav className="flex min-w-0 items-center gap-1.5 font-mono text-[11.5px]">
            {displayBreadcrumbs.map((crumb, i) => (
              <span key={`${crumb}-${i}`} className="flex items-center gap-1.5">
                {i > 0 ? <Slash className="size-3 text-grid" strokeWidth={1.4} /> : null}
                <span
                  className={cn(
                    "truncate",
                    i === displayBreadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          <button
            onClick={() => setPaletteOpen(true)}
            className="ml-auto hidden h-7 w-[300px] items-center gap-2 border border-border bg-background px-2.5 text-left text-muted-foreground transition-colors hover:border-input hover:text-foreground md:flex"
          >
            <Search className="size-3.5" strokeWidth={1.6} />
            <span className="font-mono text-[11.5px]">Search files, APIs, classes…</span>
            <kbd className="ml-auto flex items-center gap-0.5 border border-border px-1 py-0.5 font-mono text-[9.5px]">
              <Command className="size-2.5" strokeWidth={2} />K
            </kbd>
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex size-7 items-center justify-center border border-border text-muted-foreground md:hidden"
            aria-label="Search"
          >
            <Search className="size-3.5" strokeWidth={1.6} />
          </button>

          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
            <Link
              to="/projects/new"
              className="hidden h-7 items-center gap-1.5 border border-border px-2.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:flex"
            >
              <RefreshCw className="size-3" strokeWidth={1.7} />
              re-analyze
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}