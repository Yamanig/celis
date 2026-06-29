import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-celis-primary text-celis-ink-on-primary hover:bg-celis-primary/80",
        secondary:
          "border-transparent bg-celis-secondary text-celis-ink hover:bg-celis-secondary/80",
        outline: "text-celis-ink",
        destructive:
          "border-transparent bg-celis-destructive text-white hover:bg-celis-destructive/80",
        success:
          "border-transparent bg-celis-success text-white hover:bg-celis-success/80",
        caution:
          "border-transparent bg-celis-caution text-white hover:bg-celis-caution/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
