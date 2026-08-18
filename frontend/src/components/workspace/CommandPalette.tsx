import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownLeft, Search } from "lucide-react";
import { request } from "@/api/client";
import { searchIndex as fallbackIndex } from "@/mock/search";
import type { SearchItem } from "@/types";
import { cn } from "@/lib/utils";

const groupOrder: SearchItem["group"][] = ["Files", "APIs", "Classes", "Insights", "Pages"];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchItem[]>(fallbackIndex);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    if (!query.trim()) {
      setSearchResults(fallbackIndex);
      return;
    }

    request<SearchItem[]>(`/projects/:projectId/search?q=${encodeURIComponent(query)}`, fallbackIndex).then(
      (res) => {
        if (mounted && Array.isArray(res) && res.length > 0) {
          setSearchResults(res);
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, [query]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? searchResults.filter(
          (item) =>
            item.label.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q),
        )
      : searchResults;
    return groupOrder
      .map((group) => ({ group, items: matched.filter((i) => i.group === group) }))
      .filter((g) => g.items.length > 0);
  }, [query, searchResults]);

  const flat = useMemo(() => results.flatMap((g) => g.items), [results]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  const select = (item: SearchItem | undefined) => {
    if (!item) return;
    onOpenChange(false);
    void navigate({ to: item.to });
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-background/70 pt-[12vh] backdrop-blur-[2px]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="animate-rise w-full max-w-[620px] border border-border bg-surface shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 items-center gap-2.5 border-b border-border px-3.5">
          <Search className="size-4 text-muted-foreground" strokeWidth={1.6} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, flat.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                select(flat[active]);
              } else if (e.key === "Escape") {
                onOpenChange(false);
              }
            }}
            placeholder="Search files, APIs, classes, modules..."
            className="h-full flex-1 bg-transparent font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-1.5">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-[12px] text-muted-foreground">
              No symbols matched “{query}”
            </div>
          ) : (
            results.map((group) => (
              <div key={group.group} className="pb-1">
                <div className="mono-label px-3.5 py-1.5">{group.group}</div>
                {group.items.map((item) => {
                  const index = flat.indexOf(item);
                  const isActive = index === active;
                  return (
                    <button
                      key={`${item.group}-${item.label}`}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => select(item)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3.5 py-1.5 text-left cursor-pointer",
                        isActive ? "bg-surface-raised" : "hover:bg-surface-raised/60",
                      )}
                    >
                      {isActive ? (
                        <span className="h-4 w-[2px] bg-primary" />
                      ) : (
                        <span className="h-4 w-[2px]" />
                      )}
                      <span className="font-mono text-[12.5px] text-foreground">{item.label}</span>
                      <span className="ml-auto truncate font-mono text-[10.5px] text-muted-foreground">
                        {item.detail}
                      </span>
                      {isActive ? (
                        <CornerDownLeft className="size-3 text-primary" strokeWidth={1.8} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-3.5 py-2 font-mono text-[10px] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">{flat.length} results</span>
        </div>
      </div>
    </div>
  );
}