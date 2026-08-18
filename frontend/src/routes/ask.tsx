import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CornerDownLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/workspace/AppShell";
import { AiResponse } from "@/components/workspace/AiResponse";
import { askCodePilot } from "@/api/ai";
import { suggestedQuestions } from "@/mock/insights";
import type { AskAnswer } from "@/types";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask CodePilot — Codebase Console" },
      {
        name: "description",
        content:
          "Ask questions about the repository and get answers traced back to specific files and line numbers.",
      },
      { property: "og:title", content: "Ask CodePilot" },
      {
        property: "og:description",
        content: "Answers about your codebase, traced to files and line numbers.",
      },
    ],
  }),
  component: AskPage,
});

function AskPage() {
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<AskAnswer[]>([]);
  const [pending, setPending] = useState(false);

  async function submit(value: string) {
    const q = value.trim();
    if (!q || pending) return;
    setQuestion("");
    setPending(true);
    const answer = await askCodePilot(q);
    setThread((prev) => [...prev, answer]);
    setPending(false);
  }

  return (
    <AppShell breadcrumb={["medchain", "ask"]}>
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {thread.length === 0 ? (
            <div className="mx-auto max-w-[820px] px-6 py-14">
              <div className="mono-label text-primary">console</div>
              <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-foreground">
                Ask CodePilot about this repository
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Answers cite the files and lines derived from live codebase static analysis.
              </p>
              <div className="mt-8 border border-border">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => void submit(q)}
                    className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left text-[13px] text-foreground/90 transition-colors last:border-b-0 hover:bg-surface cursor-pointer"
                  >
                    <span className="font-mono text-[11px] text-primary">?</span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[900px] space-y-6 px-6 py-8">
              {thread.map((answer, i) => (
                <AiResponse key={`${answer.question}-${i}`} answer={answer} />
              ))}
              {pending ? (
                <div className="flex items-center gap-2 font-mono text-[11.5px] text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" strokeWidth={2} />
                  tracing call graph…
                </div>
              ) : null}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(question);
          }}
          className="border-t border-border bg-surface p-4"
        >
          <div className="mx-auto flex max-w-[900px] items-center gap-2 border border-border bg-background px-3">
            <span className="font-mono text-[12px] text-primary">›</span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="How does user authentication work?"
              className="h-11 flex-1 bg-transparent font-mono text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              className="flex h-7 items-center gap-1.5 border border-border px-2 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary cursor-pointer"
            >
              send
              <CornerDownLeft className="size-3" strokeWidth={1.8} />
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}