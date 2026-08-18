import { useCallback, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minimize2, Frame, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { nodeTypes } from "./nodes";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex size-7 items-center justify-center border-b border-border text-muted-foreground transition-colors last:border-b-0 hover:bg-surface-raised hover:text-primary"
    >
      {children}
    </button>
  );
}

function CanvasControls({ onReset }: { onReset: () => void }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [full, setFull] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const el = document.getElementById("codepilot-canvas");
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      setFull(false);
    } else {
      void el.requestFullscreen?.();
      setFull(true);
    }
  }, []);

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col border border-border bg-surface">
      <ControlButton label="Zoom in" onClick={() => zoomIn({ duration: 200 })}>
        <ZoomIn className="size-3.5" strokeWidth={1.7} />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={() => zoomOut({ duration: 200 })}>
        <ZoomOut className="size-3.5" strokeWidth={1.7} />
      </ControlButton>
      <ControlButton label="Fit view" onClick={() => fitView({ duration: 300, padding: 0.2 })}>
        <Frame className="size-3.5" strokeWidth={1.7} />
      </ControlButton>
      <ControlButton
        label="Reset"
        onClick={() => {
          onReset();
          fitView({ duration: 300, padding: 0.2 });
        }}
      >
        <RotateCcw className="size-3.5" strokeWidth={1.7} />
      </ControlButton>
      <ControlButton label="Fullscreen" onClick={toggleFullscreen}>
        {full ? (
          <Minimize2 className="size-3.5" strokeWidth={1.7} />
        ) : (
          <Maximize2 className="size-3.5" strokeWidth={1.7} />
        )}
      </ControlButton>
    </div>
  );
}

export function DiagramCanvas({
  nodes,
  edges,
  onNodeClick,
  onPaneClick,
  onReset,
  legend,
  className,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: NodeMouseHandler | undefined;
  onPaneClick?: (() => void) | undefined;
  onReset?: (() => void) | undefined;
  legend?: React.ReactNode;
  className?: string | undefined;
}) {
  const mounted = useMounted();

  return (
    <div id="codepilot-canvas" className={cn("relative h-full w-full bg-background", className)}>
      {mounted ? (
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            {...(onNodeClick ? { onNodeClick } : {})}
            {...(onPaneClick ? { onPaneClick } : {})}
            fitView
            fitViewOptions={{ padding: 0.22 }}
            minZoom={0.25}
            maxZoom={1.75}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            edgesFocusable={false}
            className="[&_.react-flow\_\_node]:cursor-pointer"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1}
              color="var(--grid)"
              bgColor="var(--background)"
            />
          </ReactFlow>
          <CanvasControls onReset={onReset ?? (() => undefined)} />
        </ReactFlowProvider>
      ) : (
        <div className="blueprint-grid h-full w-full opacity-40" />
      )}
      {legend ? (
        <div className="absolute bottom-3 left-3 z-10 border border-border bg-surface/95 px-3 py-2">
          {legend}
        </div>
      ) : null}
    </div>
  );
}