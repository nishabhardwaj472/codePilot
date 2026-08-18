import { cn } from "@/lib/utils";

const KEYWORDS =
  /\b(import|from|export|const|let|var|function|return|await|async|if|else|throw|new|type|interface|enum|extends|implements|default|class|for|of|in|try|catch|typeof|as|null|undefined|true|false)\b/;

function tokenize(line: string) {
  const parts: { text: string; kind: string }[] = [];
  const pattern =
    /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line))) {
    const [text] = match;
    if (match[1]) parts.push({ text, kind: "comment" });
    else if (match[2]) parts.push({ text, kind: "string" });
    else if (match[3]) parts.push({ text, kind: "number" });
    else if (match[4])
      parts.push({ text, kind: KEYWORDS.test(text) ? "keyword" : /^[A-Z]/.test(text) ? "type" : "ident" });
    else if (match[6]) parts.push({ text, kind: "punct" });
    else parts.push({ text, kind: "plain" });
  }
  return parts;
}

const kindClass: Record<string, string> = {
  comment: "text-muted-foreground/60 italic",
  string: "text-ok",
  number: "text-info",
  keyword: "text-primary",
  type: "text-warn",
  ident: "text-foreground/90",
  punct: "text-muted-foreground",
  plain: "",
};

export function CodeViewer({
  code,
  path,
  highlightLines = [],
  className,
}: {
  code: string;
  path?: string | undefined;
  highlightLines?: number[];
  className?: string | undefined;
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
      {path ? (
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
          <span className="size-1.5 bg-primary" />
          <span className="truncate font-mono text-[11.5px] text-foreground">{path}</span>
          <span className="ml-auto font-mono text-[10.5px] text-muted-foreground tabular-nums">
            {lines.length} lines
          </span>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto py-2">
        <pre className="w-max min-w-full font-mono text-[12.5px] leading-[1.65]">
          {lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                "group flex px-0",
                highlightLines.includes(i + 1)
                  ? "bg-primary/8 shadow-[inset_2px_0_0_0_var(--primary)]"
                  : "hover:bg-surface/70",
              )}
            >
              <span className="w-12 shrink-0 pr-4 text-right text-[11px] text-muted-foreground/45 select-none tabular-nums">
                {i + 1}
              </span>
              <code className="pr-6 whitespace-pre">
                {tokenize(line).map((token, j) => (
                  <span key={j} className={kindClass[token.kind]}>
                    {token.text}
                  </span>
                ))}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}