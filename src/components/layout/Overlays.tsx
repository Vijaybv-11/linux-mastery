"use client";

import { useEffect, useState } from "react";
import { useGame } from "~/contexts/GameContext";

const COLORS = ["#ff9565", "#d2f78b", "#a989e8", "#9ae1e6", "#ffd477"];

/** Toast + confetti celebration, shared by every page. */
export function Overlays() {
  const { toastMessage, celebrationKey } = useGame();
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (!celebrationKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setBurst(celebrationKey);
    const t = setTimeout(() => setBurst(0), 1800);
    return () => clearTimeout(t);
  }, [celebrationKey]);

  return (
    <>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
        {toastMessage && <div className="rounded-xl border-2 border-lm-line bg-lm-night px-4 py-3 text-sm shadow-xl">{toastMessage}</div>}
      </div>
      {burst > 0 && (
        <div key={burst} aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
          {Array.from({ length: 28 }, (_, i) => (
            <i key={i} className="lm-confetti absolute top-[-10px] block size-2.5 rounded-sm"
              style={{ left: `${i * 3.6}%`, background: COLORS[i % COLORS.length], animationDelay: `${(i % 7) * 45}ms` }} />
          ))}
        </div>
      )}
    </>
  );
}
