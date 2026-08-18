import { ArrowDown } from "lucide-react";
import { CodeViewer } from "./CodeViewer";
import type { AskAnswer } from "@/types";

export function AiResponse({ answer }: { answer: AskAnswer }) {
  return (
    <div className="animate-rise border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <span className="mono-label text-primary">investigation</span>
        {answer.provider === "gemini" ? (
          <span className="border border-primary/40 px-2 py-0.5 font-mono text-[10px] text-primary">
            REAL GEMINI AI 3.6
          </span>
        ) : (
          <span className="border border-muted-foreground/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            DETERMINISTIC FALLBACK
          </span>
        )}
        <span className="truncate font-mono text-[11.5px] text-muted-foreground">
          {answer.question}
        </span>
      </div>

      <div className="px-5 py-4">
        <p className="max-w-[76ch] text-[13.5px] leading-relaxed text-foreground/90">
          {answer.summary}
        </p>
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="mono-label pb-3">Trace</div>
        <ol className="space-y-0">
          {answer.trace.map((step, i) => (
            <li key={step.path + step.line}>
              <div className="flex flex-wrap items-baseline gap-x-3 border border-border bg-background px-3 py-2">
                <span className="font-mono text-[11.5px] text-foreground">{step.path}</span>
                <span className="font-mono text-[10.5px] text-primary tabular-nums">
                  :{step.line}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{step.note}</span>
              </div>
              {i < answer.trace.length - 1 ? (
                <ArrowDown className="my-1 ml-5 size-3.5 text-grid" strokeWidth={1.8} />
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      {answer.snippet ? (
        <div className="border-t border-border">
          <div className="h-[300px]">
            <CodeViewer code={answer.snippet.code} path={answer.snippet.path} />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        <span className="mono-label">references</span>
        {answer.related.map((ref) => (
          <span
            key={ref}
            className="border border-border px-2 py-[3px] font-mono text-[10.5px] text-foreground/80"
          >
            {ref}
          </span>
        ))}
      </div>
    </div>
  );
}