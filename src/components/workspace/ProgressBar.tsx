import { Sparkles } from "lucide-react";

/** GitMastery milestone progress bar (25/50/75/100 ticks). */
export function ProgressBar({ done, total, xp }: { done: number; total: number; xp: number }) {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-lm-ink-muted">{done}/{total} missions ({pct}%)</span>
        <span className="flex items-center gap-1 rounded-full border border-lm-gold-edge bg-lm-gold/10 px-2 py-0.5 text-xs font-semibold text-lm-gold"><Sparkles className="size-3" aria-hidden />{xp} XP</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-lm-line bg-lm-void" role="progressbar" aria-label="Missions complete" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="h-full rounded-full bg-gradient-to-r from-lm-orange to-lm-gold transition-[width] duration-700" style={{ width: `${pct}%` }} />
        {[25, 50, 75].map(t => <span key={t} className="absolute top-0 h-full w-px bg-lm-line" style={{ left: `${t}%` }} aria-hidden />)}
      </div>
      <div className="flex justify-between text-[10px] tracking-wider text-lm-ink-dim" aria-hidden>
        {["0%", "25%", "50%", "75%", "100%"].map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
