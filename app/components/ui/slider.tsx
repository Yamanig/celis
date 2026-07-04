"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "~/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-celis-surface-inset">
      <SliderPrimitive.Range className="absolute h-full bg-celis-primary" />
    </SliderPrimitive.Track>
    {props.defaultValue?.map((_, i) => (
      <SliderPrimitive.Thumb
        key={i}
        className="relative block h-6 w-6 rounded-full border-2 border-celis-primary bg-celis-surface-base ring-offset-background transition-colors after:absolute after:-inset-3 after:rounded-full after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celis-focus-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      />
    )) ??
      props.value?.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="relative block h-6 w-6 rounded-full border-2 border-celis-primary bg-celis-surface-base ring-offset-background transition-colors after:absolute after:-inset-3 after:rounded-full after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celis-focus-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
