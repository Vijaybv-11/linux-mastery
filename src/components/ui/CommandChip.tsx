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
        "inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-lm-term bg-lm-void px-2.5 py-0.5 font-code text-sm font-bold tracking-tight text-lm-term shadow-[0_0_8px_-2px_var(--color-lm-term)]",
        className,
      )}
    >
      <span className="font-code text-lm-term/60" aria-hidden>&gt;_</span>
      <span>{children}</span>
    </span>
  );
}
