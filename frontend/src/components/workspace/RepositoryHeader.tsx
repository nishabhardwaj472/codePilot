import { GitBranch, FileCode2, Github, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Project } from "@/types";

export function RepositoryHeader({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-surface px-6 py-5">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] leading-none font-semibold tracking-[-0.015em] text-foreground">
            {project.name}
          </h1>
          <span className="border border-ok/40 px-1.5 py-[2px] font-mono text-[10px] tracking-wide text-ok uppercase">
            analyzed
          </span>
        </div>
        <a
          href={`https://${project.repoUrl}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Github className="size-3.5" strokeWidth={1.6} />
          {project.repoUrl}
        </a>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GitBranch className="size-3" strokeWidth={1.6} />
            {project.branch}
          </span>
          <span className="text-grid">•</span>
          <span className="flex items-center gap-1.5">
            <FileCode2 className="size-3" strokeWidth={1.6} />
            {project.fileCount} files
          </span>
          <span className="text-grid">•</span>
          <span>{project.primaryLanguage}</span>
          <span className="text-grid">•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3" strokeWidth={1.6} />
            {project.lastAnalyzedAt}
          </span>
        </div>
      </div>

      <Link
        to="/projects/new"
        className="flex h-9 items-center gap-2 bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Analyze New Repository
      </Link>
    </div>
  );
}