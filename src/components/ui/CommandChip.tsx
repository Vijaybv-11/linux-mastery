import { cn } from "~/lib/utils";

/**
 * Eye-popping command pill: a bright lime border + soft glow, a terminal-prompt
 * ">_" icon, and monospace text. Used anywhere a command is shown to the player
 * (hints, the command briefing in the story) so commands jump out of the dark UI.
 */
export function CommandChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-lm-lime/70 bg-lm-void px-2.5 py-1 font-code text-sm font-semibold text-lm-lime shadow-[0_0_12px_-2px_var(--color-lm-lime)]",
        className,
      )}
    >
      <span className="font-code text-lm-lime/60" aria-hidden>&gt;_</span>
      <span>{children}</span>
    </span>
  );
}
