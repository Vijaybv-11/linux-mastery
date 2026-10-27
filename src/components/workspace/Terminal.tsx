"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BookOpen, RotateCcw, Send } from "lucide-react";
import { useGame } from "~/contexts/GameContext";
import { children, commandNames, resolvePath, shortPath } from "~/lib/shell";
import { cn } from "~/lib/utils";

/** GitMastery terminal chrome around the Linux practice shell. */
export function Terminal({ index }: { index: number }) {
  const { getSession, runInput, pushInfo, clearLogs, resetSession, setGuideOpen, toast } = useGame();
  const session = getSession(index);
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(session.history.length);
  const draft = useRef("");
  const output = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const path = shortPath(session.shell.cwd);

  useEffect(() => { output.current?.scrollTo({ top: output.current.scrollHeight }); }, [session.logs.length]);
  useEffect(() => { setHistoryIndex(session.history.length); }, [session.history.length]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const hist = session.history;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === hist.length) draft.current = value;
      const next = event.key === "ArrowUp" ? Math.max(0, historyIndex - 1) : Math.min(hist.length, historyIndex + 1);
      setHistoryIndex(next);
      setValue(next === hist.length ? draft.current : hist[next] ?? "");
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      clearLogs(index);
    } else if (event.key === "c" && event.ctrlKey && !window.getSelection()?.toString()) {
      event.preventDefault();
      setValue("");
    } else if (event.key === "Tab" && !event.shiftKey && value && !/["']/.test(value)) {
      const word = value.split(/\s+/).pop() ?? "";
      const prefix = value.slice(0, value.length - word.length);
      let choices: string[];
      if (!prefix.trim() || /\|\s*$/.test(prefix)) choices = commandNames.filter(c => c.startsWith(word));
      else {
        const slash = word.lastIndexOf("/");
        const parent = slash === -1 ? "." : word.slice(0, slash + 1);
        const base = word.slice(slash + 1);
        const fs = session.shell.fs;
        choices = children(fs, resolvePath(parent, session.shell.cwd))
          .map(p => ({ name: p.split("/").pop() ?? "", dir: fs[p]?.type === "dir" }))
          .filter(n => n.name.startsWith(base) && !n.name.includes(" "))
          .map(n => (slash === -1 ? "" : word.slice(0, slash + 1)) + n.name + (n.dir ? "/" : ""));
      }
      if (!choices.length) return;
      event.preventDefault();
      if (choices.length === 1) setValue(prefix + choices[0] + (choices[0]!.endsWith("/") ? "" : " "));
      else pushInfo(index, choices.join("  "));
    }
  }

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border-2 border-lm-line bg-[#120a1d] shadow-[0_6px_0_var(--color-lm-line)]" aria-label="Terminal">
      <div className="flex items-center gap-2 border-b border-lm-line bg-lm-night px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-lm-lime" aria-hidden />
        <span className="font-code text-sm text-lm-ink-muted">explorer@linux:<span className="text-lm-cyan">{path}</span></span>
        <div className="ml-auto flex gap-1">
          <button className="rounded-lg p-1.5 text-lm-ink-dim hover:bg-lm-deep hover:text-lm-ink" aria-label="Open field guide" onClick={() => setGuideOpen(true)}><BookOpen className="size-4" /></button>
          <button className="rounded-lg p-1.5 text-lm-ink-dim hover:bg-lm-deep hover:text-lm-ink" aria-label="Reset workspace"
            onClick={() => { resetSession(index); toast("Fresh workspace. Your earned XP is safe."); input.current?.focus(); }}><RotateCcw className="size-4" /></button>
        </div>
      </div>
      <div ref={output} className="lm-scroll flex-1 space-y-1 overflow-y-auto p-4 font-code text-sm leading-relaxed" onClick={() => input.current?.focus()} role="log" aria-live="polite">
        {session.logs.map((log, i) => (
          <div key={i} className={cn("break-words whitespace-pre-wrap", {
            "text-lm-ink": log.type === "command", "text-lm-ink-soft": log.type === "result", "text-lm-coral": log.type === "error",
            "text-lm-lime": log.type === "success", "text-lm-ink-dim": log.type === "info" })}>
            {log.type === "command" ? (<><span className="text-lm-cyan">{log.path}</span> <span className="text-lm-orange">$</span> {log.text}</>) : log.text}
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t border-lm-line/60 px-4 py-1.5 text-xs text-lm-ink-dim">
        <span className="font-code">{path}</span>
        <span>{session.count} command{session.count === 1 ? "" : "s"} explored · ↑↓ history · Tab completes</span>
      </div>
      <form className="flex items-center gap-2 border-t border-lm-line bg-lm-night px-4 py-2"
        onSubmit={e => { e.preventDefault(); const cmd = value.trim(); if (!cmd) return; runInput(index, cmd); setValue(""); draft.current = ""; }}>
        <label htmlFor="command-input" className="font-code font-bold text-lm-orange">$<span className="sr-only">Linux command</span></label>
        <input id="command-input" ref={input} value={value} onChange={e => setValue(e.target.value)} onKeyDown={onKeyDown} autoFocus
          spellCheck={false} autoCapitalize="off" autoComplete="off" placeholder="Enter a command..."
          className="h-9 flex-1 bg-transparent font-code text-sm text-lm-ink outline-none placeholder:text-lm-ink-dim" />
        <button type="submit" aria-label="Run command" className="rounded-lg p-2 text-lm-orange hover:bg-lm-deep"><Send className="size-4" /></button>
      </form>
    </section>
  );
}
