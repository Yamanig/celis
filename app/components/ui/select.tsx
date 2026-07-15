"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-11 w-full items-center justify-between rounded-md border border-celis-border bg-celis-surface-inset px-3 py-2 text-sm ring-offset-background placeholder:text-celis-ink-tertiary focus:outline-none focus:ring-2 focus:ring-celis-focus-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

function useMergedRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return React.useCallback(
    (value: T) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") ref(value);
        else if (ref && "current" in ref) (ref as React.MutableRefObject<T>).current = value;
      });
    },
    [refs]
  );
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, forwardedRef) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(forwardedRef, contentRef);
  const isMobile = useIsMobile();

  // Watch Radix data-state attribute to know when the dropdown is open.
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setIsOpen(el.getAttribute("data-state") === "open");
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, []);

  // Lock body scroll on mobile while the dropdown is open.
  React.useEffect(() => {
    if (!isOpen || !isMobile) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen, isMobile]);

  // Mobile back button closes the select instead of navigating back.
  React.useEffect(() => {
    if (!isOpen || !isMobile) return;
    const token = `celis-select-${Date.now()}`;
    window.history.pushState({ celisSelectClose: token }, "");
    const handler = (e: PopStateEvent) => {
      if (e.state?.celisSelectClose === token) {
        // Close the select by dispatching Escape on the document.
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      }
    };
    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      // If our pushed entry is still current, the dropdown was closed by a
      // selection rather than the back button. Replace the marker so we do not
      // navigate backwards; a real back event already moved to the prior entry.
      if (window.history.state?.celisSelectClose === token) {
        window.history.replaceState(null, document.title, window.location.href);
      }
    };
  }, [isOpen, isMobile]);

  // Scroll the first option into view when nothing is selected, or the
  // selected option when one exists, keeping earlier options reachable.
  React.useEffect(() => {
    if (!isOpen) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    requestAnimationFrame(() => {
      const selected = viewport.querySelector('[data-state="checked"]') as HTMLElement | null;
      const first = viewport.querySelector('[role="option"]') as HTMLElement | null;
      if (selected) {
        selected.scrollIntoView({ block: "nearest", inline: "nearest" });
      } else if (first) {
        viewport.scrollTop = 0;
      }
    });
  }, [isOpen]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={mergedRef}
        className={cn(
          "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-celis-border bg-celis-surface-elevated text-celis-ink shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "max-h-[min(24rem,var(--radix-select-content-available-height))]",
          // Mobile bottom-sheet: fixed to the bottom of the viewport, full
          // width, capped height, safe-area padding, and no popper transform.
          "max-sm:!fixed max-sm:!bottom-0 max-sm:!left-0 max-sm:!right-0 max-sm:!top-auto max-sm:!transform-none max-sm:max-h-[80dvh] max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-xl max-sm:border-x-0 max-sm:border-b-0 max-sm:shadow-2xl max-sm:pb-[env(safe-area-inset-bottom)]",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport
          ref={viewportRef}
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
            "max-sm:h-auto max-sm:w-full max-sm:min-w-0 max-sm:max-h-[calc(80dvh-3rem)] max-sm:touch-pan-y"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-celis-primary-subtle focus:text-celis-ink data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
