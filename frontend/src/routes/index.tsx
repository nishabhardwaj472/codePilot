import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Database, GitBranch, Moon, Network, Sun, Terminal } from "lucide-react";
import { Logo } from "@/components/workspace/Logo";
import { FileTree } from "@/components/workspace/FileTree";
import { StatusDot } from "@/components/workspace/StatusBadge";
import { fileTree, metrics, project } from "@/mock/project";
import { useTheme } from "@/context/ThemeContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodePilot — Understand your codebase before you touch it" },
      {
        name: "description",
        content:
          "CodePilot turns unfamiliar repositories into interactive architecture maps, dependency graphs and actionable engineering insights.",
      },
      { property: "og:title", content: "CodePilot — Codebase Intelligence" },
      {
        property: "og:description",
        content:
          "Architecture maps, dependency graphs, ER diagrams and code intelligence for any repository.",
      },
    ],
  }),
  component: Landing,
});

const navLinks = ["Product", "Features", "How it Works", "Docs"];

function ThemeToggleBtn() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 items-center gap-1.5 border border-border bg-surface px-2.5 font-mono text-[11.5px] text-foreground transition-colors hover:border-primary/50 cursor-pointer select-none"
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

function MockNode({
  label,
  meta,
  tone = "ok",
}: {
  label: string;
  meta: string;
  tone?: "ok" | "warn" | "info";
}) {
  return (
    <div className="w-[200px] border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="mono-label">module</span>
        <StatusDot tone={tone} pulse={tone !== "ok"} />
      </div>
      <div className="px-3 py-2">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{meta}</div>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex h-8 justify-center">
      <span className="w-px bg-grid" />
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center gap-8 px-6">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <span
                key={link}
                className="cursor-default text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link}
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggleBtn />
            <Link
              to="/dashboard"
              className="flex h-8 items-center gap-2 border border-primary/50 px-3 text-[13px] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Open Workspace
              <ArrowRight className="size-3.5" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
        <div className="relative mx-auto grid max-w-[1360px] gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="mono-label flex items-center gap-2 text-primary">
              <span className="h-px w-6 bg-primary" />
              Codebase Intelligence
            </div>
            <h1 className="mt-5 max-w-[22ch] text-[44px] leading-[1.06] font-semibold tracking-[-0.03em] text-foreground md:text-[58px]">
              Understand your codebase before you touch it.
            </h1>
            <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
              CodePilot turns unfamiliar repositories into interactive architecture maps, dependency
              graphs and actionable engineering insights.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/projects/new"
                className="flex h-10 items-center gap-2 bg-primary px-5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Analyze a Repository
              </Link>
              <Link
                to="/dashboard"
                className="flex h-10 items-center gap-2 border border-border px-5 text-[13.5px] text-foreground transition-colors hover:border-input hover:bg-surface"
              >
                <Terminal className="size-3.5" strokeWidth={1.7} />
                Explore Demo
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px self-end border border-border bg-border lg:grid-cols-1">
            {[
              { icon: Boxes, label: "Architecture layers", value: "6" },
              { icon: Network, label: "Dependency edges", value: "96" },
              { icon: Database, label: "Schema relations", value: "4" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-surface px-4 py-3.5">
                <item.icon className="size-4 text-primary" strokeWidth={1.6} />
                <span className="text-[13px] text-muted-foreground">{item.label}</span>
                <span className="ml-auto font-mono text-[15px] text-foreground tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-6 py-14">
        <div className="border border-border bg-surface">
          <div className="flex h-10 items-center gap-3 border-b border-border px-4">
            <Logo showText={false} />
            <span className="text-[13px] font-medium text-foreground">CodePilot</span>
            <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <GitBranch className="size-3" strokeWidth={1.6} />
              Repository: {project.name}
            </div>
          </div>

          <div className="grid lg:grid-cols-[240px_minmax(0,1fr)_220px]">
            <div className="border-b border-border lg:border-r lg:border-b-0">
              <div className="mono-label border-b border-border px-4 py-2">Files</div>
              <FileTree nodes={fileTree.slice(0, 1)} />
            </div>

            <div className="relative border-b border-border p-8 lg:border-r lg:border-b-0">
              <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
              <div className="mono-label relative pb-6">Architecture</div>
              <div className="relative flex flex-col items-center">
                <MockNode label="Frontend" meta="React · 11 files" />
                <Connector />
                <MockNode label="API Layer" meta="Express · 11 routes" />
                <Connector />
                <MockNode label="Services" meta="Domain · 4 services" tone="warn" />
                <Connector />
                <MockNode label="Database" meta="MongoDB · 5 collections" tone="info" />
              </div>
            </div>

            <div>
              <div className="mono-label border-b border-border px-4 py-2">Signals</div>
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-baseline justify-between border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <span className="text-[12.5px] text-muted-foreground">{metric.label}</span>
                  <span className="font-mono text-[13px] text-foreground tabular-nums">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-4 px-6 py-6">
          <Logo />
          <span className="font-mono text-[11px] text-muted-foreground">
            frontend demo · codebase intelligence platform
          </span>
          <Link
            to="/dashboard"
            className="ml-auto font-mono text-[11.5px] text-primary hover:underline"
          >
            open workspace →
          </Link>
        </div>
      </footer>
    </div>
  );
}
