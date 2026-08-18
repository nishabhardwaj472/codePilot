import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/workspace/AppShell";
import { FileTree } from "@/components/workspace/FileTree";
import { CodeViewer } from "@/components/workspace/CodeViewer";
import { InspectorList, InspectorPanel, InspectorStat } from "@/components/workspace/InspectorPanel";
import { getFileSource } from "@/api/analysis";
import { getFileTree } from "@/api/projects";
import { fileTree as fallbackTree } from "@/mock/project";
import { defaultFilePath, getCode, getIntelligence } from "@/mock/code";
import type { FileNode } from "@/types";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "File Intelligence — CodePilot" },
      {
        name: "description",
        content:
          "Browse repository files with syntax-highlighted source, per-file purpose, exports and dependency notes.",
      },
      { property: "og:title", content: "File Intelligence — CodePilot" },
      {
        property: "og:description",
        content: "Read any file next to its purpose, exports, complexity and dependency notes.",
      },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const [treeNodes, setTreeNodes] = useState<FileNode[]>(fallbackTree);
  const [path, setPath] = useState(defaultFilePath);
  const [sourceCode, setSourceCode] = useState<string>(getCode(defaultFilePath));
  const [intelligence, setIntelligence] = useState<any>(getIntelligence(defaultFilePath));

  useEffect(() => {
    let mounted = true;
    getFileTree().then((tree) => {
      if (mounted && Array.isArray(tree) && tree.length > 0) {
        setTreeNodes(tree);

        const firstRoot = tree[0];
        if (firstRoot) {
          const firstFile = findFirstFilePath(firstRoot);
          if (firstFile) {
            setPath(firstFile);
          }
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!path) return;

    getFileSource(path).then((res: any) => {
      if (mounted && res) {
        if (res.code !== undefined) setSourceCode(res.code);
        if (res.intelligence) {
          setIntelligence({
            purpose: `Source code for ${path}`,
            loc: res.intelligence.lineCount || res.code.split("\n").length,
            complexity: res.intelligence.symbols?.length > 5 ? "Medium" : "Low",
            lastChanged: "Analyzed file",
            exports: (res.intelligence.symbols || []).filter((s: any) => s.exported).map((s: any) => s.name),
            dependencies: (res.intelligence.imports || []).map((i: any) => i.target),
            notes: (res.intelligence.importedBy || []).map((i: any) => `Imported by ${i.source}`),
          });
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [path]);

  return (
    <AppShell breadcrumb={["medchain", "files"]}>
      <div className="grid h-full lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <div className="min-h-0 overflow-y-auto border-b border-border lg:border-r lg:border-b-0">
          <div className="mono-label border-b border-border px-4 py-2">Explorer</div>
          <FileTree
            nodes={treeNodes}
            selected={path}
            onSelect={(node) => {
              if (node.type === "file" || node.file) setPath(node.path);
            }}
          />
        </div>

        <div className="min-h-0 border-b border-border lg:border-r lg:border-b-0">
          <CodeViewer path={path} code={sourceCode} />
        </div>

        <InspectorPanel
          className="hidden lg:flex"
          title={path.split("/").pop() ?? path}
          subtitle={path}
        >
          <div className="border-b border-border px-4 py-3 text-[12.5px] leading-relaxed text-foreground/85">
            {intelligence.purpose}
          </div>
          <InspectorStat label="Lines" value={intelligence.loc} />
          <InspectorStat label="Complexity" value={intelligence.complexity} />
          <InspectorStat label="Last changed" value={intelligence.lastChanged} />
          <InspectorList label="Exports" items={intelligence.exports || []} />
          <InspectorList label="Dependencies" items={intelligence.dependencies || []} />
          <InspectorList label="Notes" items={intelligence.notes || []} />
        </InspectorPanel>
      </div>
    </AppShell>
  );
}

function findFirstFilePath(node: FileNode): string | null {
  if (node.type === "file" || node.file) return node.path;
  if (node.children) {
    for (const child of node.children) {
      const p = findFirstFilePath(child);
      if (p) return p;
    }
  }
  return null;
}