"use client";

import { BookOpen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { lessons, pad2 } from "~/lib/lessons";

/** GitMastery StoryDialog: Maya's briefing with real-world context, the command, and the task. */
export function StoryDialog({ index, open, onOpenChange }: { index: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const lesson = lessons[index];
  if (!lesson) return null;
  const { scenario } = lesson;
  const close = () => { onOpenChange(false); setTimeout(() => document.getElementById("command-input")?.focus(), 50); };
  return (
    <Dialog open={open} onOpenChange={o => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-3xl gap-5 p-6 sm:p-8" onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); close(); } }}>
        <div className="flex flex-wrap items-center gap-3 pr-8">
          <DialogTitle className="flex flex-1 items-center gap-2 font-display text-xl uppercase sm:text-2xl"><BookOpen className="size-6 text-lm-violet" aria-hidden />{scenario.title}</DialogTitle>
          <span className="rounded-full border border-lm-line px-2.5 py-0.5 text-xs text-lm-ink-muted">Mission {pad2(index + 1)} / {lessons.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-lm-grape font-bold" aria-hidden>M</span>
          <span><strong className="block text-sm">Maya</strong><small className="text-xs text-lm-ink-dim">Your teammate · Your first Linux shift</small></span>
        </div>
        {/* Story narrative with the command woven inline — the concept picks up where the
            story leaves off, and its <code> chips light up the commands right in the prose
            (gitmastery style) instead of a separate boxed command section. */}
        <DialogDescription className="text-base leading-relaxed whitespace-pre-line text-lm-ink-soft sm:text-lg">{scenario.story}</DialogDescription>
        {/* Trusted, authored-in-repo HTML containing only <code> tags. */}
        <p className="lm-cmd-copy text-base leading-relaxed text-lm-ink-soft sm:text-lg" dangerouslySetInnerHTML={{ __html: lesson.concept }} />
        <div className="lm-inset rounded-xl p-5">
          <strong className="text-xs tracking-[0.15em] text-lm-cyan uppercase">Real-World Context</strong>
          <h3 className="mt-1 font-semibold">{scenario.setting}</h3>
          <p className="text-sm text-lm-ink-muted">{scenario.useCase}</p>
        </div>
        <div className="rounded-xl border border-lm-orange-edge bg-lm-orange/10 p-5">
          <strong className="text-xs tracking-[0.15em] text-lm-orange uppercase">Your Task</strong>
          <p className="mt-1 text-sm">{lesson.objective}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close}>Skip story</Button>
          <Button onClick={close} autoFocus>Start mission <kbd className="rounded bg-lm-void/20 px-1.5 text-xs">Ctrl+Enter</kbd></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
