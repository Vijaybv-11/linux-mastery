import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-lm-line/70 bg-lm-night/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-lm-ink-dim sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-display text-lm-ink">
          <span className="font-code text-lm-orange">&gt;_</span> Linux Mastery
        </Link>
        <p>Learn the terminal one small win at a time. Inspired by GitMastery.</p>
        <p className="font-code text-xs">Local accounts · progress stays on this computer</p>
      </div>
    </footer>
  );
}
