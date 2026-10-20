"use client";

import { useState } from "react";
import { File, Folder } from "lucide-react";
import { HOME, children, shortPath, type ShellState } from "~/lib/shell";
import { cn } from "~/lib/utils";

/** Live filesystem view (GitMastery's file panel), highlighting the working directory. */
export function FileTree({ shell }: { shell: ShellState }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { fs, cwd } = shell;
  const rows: { path: string; depth: number }[] = [];
  const walk = (path: string, depth: number) => {
    if (!fs[path]) return;
    rows.push({ path, depth });
    if (fs[path].type === "dir") children(fs, path).forEach(c => walk(c, depth + 1));
  };
  walk(HOME, 0);
  const node = selected ? fs[selected] : undefined;

  return (
    <div className="grid gap-3">
      <div className="lm-scroll max-h-80 overflow-y-auto rounded-xl border border-lm-line bg-lm-void p-2 font-code text-sm">
        <div className="px-2 py-1 text-xs text-lm-ink-dim">/home</div>
        {rows.map(({ path, depth }) => {
          const dir = fs[path]!.type === "dir";
          return (
            <button key={path} title={path} onClick={() => setSelected(path)} aria-label={`Inspect ${path}`}
              style={{ paddingLeft: 8 + depth * 14 }}
              className={cn("flex w-full items-center gap-2 rounded-md py-1 pr-2 text-left hover:bg-lm-deep",
                dir ? "text-lm-cyan" : "text-lm-ink-soft", path === cwd && "bg-lm-grape/40 ring-1 ring-lm-grape-hi", path === selected && "bg-lm-deep")}>
              {dir ? <Folder className="size-3.5 shrink-0" aria-hidden /> : <File className="size-3.5 shrink-0" aria-hidden />}
              {path.split("/").pop()}{dir ? "/" : ""}
            </button>
          );
        })}
      </div>
      <div className="lm-inset rounded-xl p-3 text-sm">
        {node && selected ? (
          <>
            <p className="text-xs font-semibold tracking-[0.15em] text-lm-violet">{node.type === "dir" ? "DIRECTORY" : "FILE"}</p>
            <p className="font-code text-lm-ink">{shortPath(selected)}</p>
            <p className="text-xs text-lm-ink-dim">Permissions: {node.mode}</p>
            <pre className="mt-2 max-h-40 overflow-auto font-code text-xs whitespace-pre-wrap text-lm-ink-soft">
              {node.type === "dir" ? `${children(fs, selected).length} items` : node.content || "(empty file)"}
            </pre>
          </>
        ) : (
          <><p className="text-xs font-semibold tracking-[0.15em] text-lm-violet">LIVE VIEW</p><p className="text-lm-ink-muted">Click a file to peek inside. Highlight shows your working directory.</p></>
        )}
      </div>
    </div>
  );
}
