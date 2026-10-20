"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useGame } from "~/contexts/GameContext";
import { fieldGuide } from "~/lib/fieldGuide";

/** GitMastery command-reference dialog with live search, recoloured as the Linux Field Guide. */
export function FieldGuideDialog() {
  const { guideOpen, setGuideOpen } = useGame();
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fieldGuide
      .map(g => ({ ...g, rows: g.rows.filter(([c, m]) => !q || `${c} ${m}`.toLowerCase().includes(q)) }))
      .filter(g => g.rows.length);
  }, [query]);

  return (
    <Dialog open={guideOpen} onOpenChange={open => { setGuideOpen(open); if (!open) setQuery(""); }}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-lm-orange">A FRIEND BESIDE THE PROMPT</p>
          <DialogTitle className="font-display text-2xl">Your field guide<span className="text-lm-orange">.</span></DialogTitle>
          <DialogDescription>The commands available in your practice terminal. Quote names that contain spaces.</DialogDescription>
        </DialogHeader>
        <label className="mx-6 flex items-center gap-2 rounded-xl border border-lm-line bg-lm-void px-3">
          <Search className="size-4 text-lm-ink-dim" aria-hidden />
          <span className="sr-only">Search commands</span>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search commands… (try “copy” or “ls”)"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-lm-ink-dim" />
        </label>
        <div className="lm-scroll max-h-[55vh] space-y-5 overflow-y-auto px-6 pb-6">
          {groups.map(g => (
            <section key={g.title}>
              <h3 className="mb-2 text-xs font-bold tracking-[0.15em] text-lm-violet uppercase">{g.title}</h3>
              <div className="divide-y divide-lm-line overflow-hidden rounded-xl border border-lm-line">
                {g.rows.map(([cmd, meaning]) => (
                  <div key={cmd} className="grid gap-1 bg-lm-night px-4 py-2.5 sm:grid-cols-[14rem_1fr]">
                    <code className="font-code text-sm text-lm-lime">{cmd}</code>
                    <span className="text-sm text-lm-ink-muted">{meaning}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {!groups.length && <p className="py-8 text-center text-sm text-lm-ink-dim">No commands match that search.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
