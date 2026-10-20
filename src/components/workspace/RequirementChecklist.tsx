import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

/** GitMastery RequirementChecklist: one objective row per requirement, checked when cleared. */
export function RequirementChecklist({ items }: { items: { text: string; done: boolean }[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold tracking-[0.15em] text-lm-ink-dim uppercase">Objectives</h3>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.text} className={cn("flex items-start gap-3 rounded-xl border p-3 transition-colors", item.done ? "border-lm-lime-edge bg-lm-lime/10" : "border-lm-line bg-lm-void")}>
            <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2", item.done ? "border-lm-lime-edge bg-lm-lime text-lm-void" : "border-lm-line")} aria-hidden>
              {item.done && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className={cn("text-sm", item.done ? "text-lm-ink-muted line-through" : "text-lm-ink")}>{item.text}</span>
            <span className="sr-only">{item.done ? "Objective complete" : "Objective not yet complete"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
