import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Circle, Clipboard, FolderUp, Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/workspace/AppShell";
import {
  uploadGitHubRepo,
  uploadPastedStructure,
  uploadProjectZip,
  type ProjectUploadResponse,
} from "@/api/projects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/new")({
  head: () => ({
    meta: [
      { title: "Bring a codebase into CodePilot" },
      {
        name: "description",
        content:
          "Start a CodePilot analysis from a repository ZIP, a connected GitHub repository or a pasted project structure.",
      },
      { property: "og:title", content: "Analyze a repository — CodePilot" },
      {
        property: "og:description",
        content: "Upload a ZIP, connect GitHub or paste a codebase snapshot to begin analysis.",
      },
    ],
  }),
  component: NewProject,
});

interface HonestStep {
  id: string;
  label: string;
  detail: string;
}

function NewProject() {
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"zip" | "github" | "paste">("zip");
  const [githubUrl, setGithubUrl] = useState("");
  const [pasteStructure, setPasteStructure] = useState("");
  const [step, setStep] = useState(0);
  const [honestSteps, setHonestSteps] = useState<HonestStep[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Invalid file type", {
        description: "Only ZIP repository archives (.zip) are supported.",
      });
      return;
    }

    const maxSizeBytes = 120 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("File too large", {
        description: "File size exceeds the 120 MB limit.",
      });
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    startPipelineProcess([
      { id: "upload", label: "Uploading repository...", detail: `${sizeMb} MB` },
      { id: "extract", label: "Extracting repository...", detail: "Safely unzipping to temp/" },
      { id: "scan", label: "Scanning files...", detail: "Detecting languages & file structure" },
      { id: "ready", label: "Repository ready", detail: "Metadata extracted" },
    ], () => uploadProjectZip(file));
  };

  const handleGitHubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = githubUrl.trim();
    if (!url) return;

    startPipelineProcess([
      { id: "fetch", label: "Fetching GitHub repository...", detail: url },
      { id: "extract", label: "Extracting archive...", detail: "Safely extracting to temp/" },
      { id: "scan", label: "Scanning AST & structure...", detail: "Analyzing dependencies & routes" },
      { id: "ready", label: "Repository ready", detail: "Metadata extracted" },
    ], () => uploadGitHubRepo(url));
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const structure = pasteStructure.trim();
    if (!structure) return;

    startPipelineProcess([
      { id: "parse", label: "Parsing structure snapshot...", detail: "Extracting file paths" },
      { id: "tree", label: "Building virtual tree...", detail: "Inferring architecture layers" },
      { id: "ready", label: "Snapshot ready", detail: "Metadata generated" },
    ], () => uploadPastedStructure(structure, "Snapshot-Project"));
  };

  const startPipelineProcess = async (
    steps: HonestStep[],
    apiCall: () => Promise<ProjectUploadResponse>
  ) => {
    setHonestSteps(steps);
    setStep(0);
    setRunning(true);

    try {
      const stepTimer1 = setTimeout(() => setStep(1), 400);
      const stepTimer2 = setTimeout(() => setStep(2), 900);

      const response = await apiCall();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setStep(steps.length);

      setTimeout(() => {
        toast.success("Repository analyzed", {
          description: `${response.project.name} · ${response.project.fileCount} files indexed`,
        });
        void navigate({ to: "/dashboard" });
      }, 600);
    } catch (err: any) {
      setRunning(false);
      setStep(0);
      toast.error("Analysis failed", {
        description: err.message || "Failed to process repository.",
      });
    }
  };

  return (
    <AppShell breadcrumb={["medchain", "new analysis"]}>
      <div className="relative h-full overflow-y-auto">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.3]" />
        <div className="relative mx-auto max-w-[980px] px-6 py-14">
          <div className="mono-label text-primary">command center</div>
          <h1 className="mt-4 text-[32px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
            Bring a codebase into CodePilot
          </h1>
          <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-muted-foreground">
            CodePilot indexes structure, dependencies and data models. Nothing is executed on the
            server — uploaded repositories are scanned safely.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!running ? (
            <div className="mt-10 border border-border bg-surface">
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("zip")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 border-r border-border px-5 py-4 font-mono text-[13px] transition-colors cursor-pointer",
                    activeTab === "zip"
                      ? "bg-surface-raised font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <FolderUp className="size-4" />
                  Upload ZIP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("github")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 border-r border-border px-5 py-4 font-mono text-[13px] transition-colors cursor-pointer",
                    activeTab === "github"
                      ? "bg-surface-raised font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Github className="size-4" />
                  GitHub Repo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("paste")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 px-5 py-4 font-mono text-[13px] transition-colors cursor-pointer",
                    activeTab === "paste"
                      ? "bg-surface-raised font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Clipboard className="size-4" />
                  Paste Structure
                </button>
              </div>

              <div className="p-6">
                {activeTab === "zip" && (
                  <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center">
                    <FolderUp className="size-10 text-muted-foreground/60" strokeWidth={1.4} />
                    <div className="mt-4 text-[15px] font-medium text-foreground">
                      Select repository ZIP archive
                    </div>
                    <div className="mt-1 font-mono text-[12px] text-muted-foreground">
                      Max 120 MB · node_modules ignored
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-6 flex h-9 items-center gap-2 bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      Browse ZIP File
                    </button>
                  </div>
                )}

                {activeTab === "github" && (
                  <form onSubmit={handleGitHubSubmit} className="space-y-4">
                    <div>
                      <label className="mono-label block pb-2 text-foreground">
                        Public GitHub Repository URL
                      </label>
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/expressjs/express"
                        className="h-10 w-full border border-border bg-background px-3 font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!githubUrl.trim()}
                      className="flex h-9 items-center gap-2 bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      Fetch & Analyze Repository
                    </button>
                  </form>
                )}

                {activeTab === "paste" && (
                  <form onSubmit={handlePasteSubmit} className="space-y-4">
                    <div>
                      <label className="mono-label block pb-2 text-foreground">
                        Repository Structure / File Paths (one per line)
                      </label>
                      <textarea
                        value={pasteStructure}
                        onChange={(e) => setPasteStructure(e.target.value)}
                        rows={8}
                        placeholder={`src/index.js\nsrc/app.js\nsrc/controllers/userController.js\nsrc/models/User.js\nsrc/routes/userRoutes.js`}
                        className="w-full border border-border bg-background p-3 font-mono text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!pasteStructure.trim()}
                      className="flex h-9 items-center gap-2 bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      Analyze Pasted Structure
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-10 border border-border bg-surface">
              <div className="flex items-center gap-3 border-b border-border px-5 py-3">
                <Loader2 className="size-3.5 animate-spin text-primary" strokeWidth={2} />
                <span className="text-[13px] text-foreground">Scanning repository</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
                  {Math.min(step, honestSteps.length)}/{honestSteps.length}
                </span>
              </div>
              <ol>
                {honestSteps.map((s, i) => {
                  const state = i < step ? "done" : i === step ? "active" : "pending";
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
                    >
                      {state === "done" ? (
                        <Check className="size-3.5 text-ok" strokeWidth={2.2} />
                      ) : state === "active" ? (
                        <span className="size-2 animate-dot rounded-full bg-primary" />
                      ) : (
                        <Circle className="size-3 text-grid" strokeWidth={1.6} />
                      )}
                      <span
                        className={cn(
                          "text-[13px]",
                          state === "pending" ? "text-muted-foreground/60" : "text-foreground",
                        )}
                      >
                        {s.label}
                      </span>
                      <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
                        {state === "pending" ? "queued" : s.detail}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}