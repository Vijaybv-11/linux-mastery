import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

/**
 * Status pills. Variants follow the Linux legend: lime = done, cyan = path/info,
 * coral = danger, gold = rewards, grape = neutral brand.
 */
const badgeVariants = cva("lm-chip", {
    variants: {
        variant: {
            default: "bg-lm-lime text-lm-void",
            secondary: "bg-lm-grape text-lm-ink",
            destructive: "bg-lm-coral text-lm-void",
            info: "bg-lm-cyan text-lm-void",
            reward: "bg-lm-gold text-lm-void",
            outline: "border-lm-line bg-lm-void text-lm-ink-soft",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
