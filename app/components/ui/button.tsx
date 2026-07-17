import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-celis-primary text-celis-ink-on-primary hover:bg-celis-primary-hover active:bg-celis-primary-active",
        secondary:
          "bg-celis-secondary text-celis-ink hover:bg-celis-secondary-hover",
        outline:
          "border border-celis-border bg-transparent hover:bg-celis-secondary-subtle",
        ghost: "hover:bg-celis-secondary-subtle",
        destructive:
          "bg-celis-destructive text-celis-ink-inverse hover:bg-celis-destructive-hover",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, onClick, ...props }, ref) => {
    const [pending, setPending] = React.useState(false);
    const Comp = asChild ? Slot : "button";

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (
      event
    ) => {
      if (!onClick || asChild) return onClick?.(event);
      const result = (onClick as (event: React.MouseEvent<HTMLButtonElement>) => unknown)(event);
      if (
        result &&
        typeof (result as Promise<unknown>).then === "function" &&
        !event.defaultPrevented
      ) {
        setPending(true);
        try {
          await result;
        } finally {
          setPending(false);
        }
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || pending}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
