import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

/**
 * Arcade buttons: a solid colour "edge" sits under the face and the face sinks into it on
 * press. Solid variants carry the edge; ghost and link stay flat so toolbars don't turn
 * into a wall of keycaps.
 *
 * Disabled is a flat `lm-deep` surface with dim ink rather than a 50% fade: a faded accent
 * fill drops its own label to ~1.9:1, and "you can't afford this yet" is information the
 * player still has to be able to read.
 */
const buttonVariants = cva(
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border-2 font-semibold whitespace-nowrap transition-[transform,box-shadow,filter,background-color,color,border-color] duration-150 ease-[var(--ease-out-expo)] select-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-lm-cyan disabled:pointer-events-none disabled:border-lm-line disabled:bg-lm-deep disabled:text-lm-ink-dim disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:brightness-100 motion-reduce:transition-[background-color,color,border-color] motion-reduce:hover:translate-y-0",
    {
        variants: {
            variant: {
                default:
                    "border-lm-orange-edge bg-lm-orange text-lm-void shadow-[0_4px_0_var(--color-lm-orange-edge)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_6px_0_var(--color-lm-orange-edge)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-lm-orange-edge)] motion-reduce:hover:shadow-[0_4px_0_var(--color-lm-orange-edge)]",
                secondary:
                    "border-lm-grape-edge bg-lm-grape text-lm-ink shadow-[0_4px_0_var(--color-lm-grape-edge)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_6px_0_var(--color-lm-grape-edge)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-lm-grape-edge)] motion-reduce:hover:shadow-[0_4px_0_var(--color-lm-grape-edge)]",
                destructive:
                    "border-lm-coral-edge bg-lm-coral text-lm-void shadow-[0_4px_0_var(--color-lm-coral-edge)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_6px_0_var(--color-lm-coral-edge)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-lm-coral-edge)] motion-reduce:hover:shadow-[0_4px_0_var(--color-lm-coral-edge)]",
                outline:
                    "border-lm-line bg-lm-night text-lm-ink shadow-[0_4px_0_var(--color-lm-line)] hover:-translate-y-0.5 hover:border-lm-grape-hi hover:shadow-[0_6px_0_var(--color-lm-line)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-lm-line)] motion-reduce:hover:shadow-[0_4px_0_var(--color-lm-line)]",
                ghost: "border-transparent bg-transparent text-lm-ink-soft hover:bg-lm-deep hover:text-lm-ink disabled:bg-transparent",
                link: "border-transparent bg-transparent text-lm-orange underline-offset-4 hover:underline disabled:bg-transparent",
            },
            size: {
                default: "h-11 rounded-[0.85rem] px-4 text-sm",
                sm: "h-9 rounded-[0.7rem] px-3 text-sm",
                lg: "h-13 rounded-2xl px-6 text-base",
                icon: "h-11 w-11 rounded-[0.85rem]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
