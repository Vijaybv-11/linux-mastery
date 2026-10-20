"use client";

import { useEffect, useState } from "react";

const SCRIPT = [
  { cmd: "pwd", out: "/home/explorer" },
  { cmd: "ls", out: "Documents  Downloads  notes.txt" },
  { cmd: "cd Documents", out: "" },
  { cmd: "cat welcome.txt", out: "Welcome aboard. — Maya" },
];

/** Animated demo terminal + penguin sticker (GitMastery hero art, Linux edition). */
export function HeroDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setStep(SCRIPT.length);
    const t = setInterval(() => setStep(s => (s >= SCRIPT.length + 2 ? 0 : s + 1)), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border-2 border-lm-line bg-[#120a1d] shadow-[0_8px_0_var(--color-lm-line)]">
        <div className="flex items-center gap-1.5 border-b border-lm-line bg-lm-night px-4 py-2.5">
          {["bg-lm-coral", "bg-lm-gold", "bg-lm-lime"].map(c => <span key={c} className={`size-2.5 rounded-full ${c}`} aria-hidden />)}
          <span className="ml-2 font-code text-xs text-lm-ink-dim">explorer@linux: ~</span>
        </div>
        <div className="min-h-56 space-y-1 p-5 font-code text-sm" aria-hidden>
          {SCRIPT.slice(0, Math.min(step, SCRIPT.length)).map(line => (
            <div key={line.cmd}>
              <div><span className="text-lm-orange">$</span> <span className="text-lm-ink">{line.cmd}</span></div>
              {line.out && <div className="text-lm-ink-muted">{line.out}</div>}
            </div>
          ))}
          <div><span className="text-lm-orange">$</span> <span className="lm-caret inline-block h-4 w-2 translate-y-0.5 bg-lm-orange" /></div>
        </div>
      </div>
      <span className="absolute -top-4 -right-3 rotate-6 rounded-xl border-2 border-lm-gold-edge bg-lm-gold px-3 py-1 font-display text-sm text-lm-void shadow-[0_4px_0_var(--color-lm-gold-edge)]">+10 XP</span>
      <svg viewBox="0 0 120 140" className="absolute -bottom-10 -left-8 w-28 -rotate-6 drop-shadow-xl" role="img" aria-label="Penguin mascot">
        <ellipse cx="60" cy="80" rx="44" ry="54" fill="#1f1430" stroke="#594069" strokeWidth="4" />
        <ellipse cx="60" cy="92" rx="28" ry="38" fill="#fff3e5" />
        <circle cx="47" cy="56" r="7" fill="#fff3e5" /><circle cx="73" cy="56" r="7" fill="#fff3e5" />
        <circle cx="48" cy="57" r="3.5" fill="#140c22" /><circle cx="72" cy="57" r="3.5" fill="#140c22" />
        <path d="M52 68 L68 68 L60 78 Z" fill="#ff9565" />
        <ellipse cx="44" cy="134" rx="12" ry="5" fill="#ff9565" /><ellipse cx="76" cy="134" rx="12" ry="5" fill="#ff9565" />
      </svg>
    </div>
  );
}
