"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function Combobox({
  value = "",
  onValueChange,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  disabled,
  label,
}: ComboboxProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const optionRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const isMobile = useIsMobile();
  const listboxId = React.useId();
  const triggerId = React.useId();

  const selected = options.find((option) => option.value === value);
  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const selectOption = (next: string) => {
    onValueChange(next);
    setOpen(false);
    setQuery("");
  };

  // Scroll the first option into view when nothing is selected, or the selected
  // option when one exists. On mobile this runs once the bottom sheet opens.
  React.useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      const target = value
        ? optionRefs.current[value]
        : listRef.current?.querySelector('[role="option"]') as HTMLElement | null;
      if (target) {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      } else if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [open, value]);

  // Lock body scroll on mobile while the dropdown is open.
  React.useEffect(() => {
    if (!open || !isMobile) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open, isMobile]);

  // Mobile back button closes the dropdown instead of navigating back.
  React.useEffect(() => {
    if (!open || !isMobile) return;
    const token = `celis-combobox-${Date.now()}`;
    window.history.pushState({ celisComboboxClose: token }, "");
    const handler = (e: PopStateEvent) => {
      if (e.state?.celisComboboxClose === token) {
        setOpen(false);
      }
    };
    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      if (window.history.state?.celisComboboxClose === token) {
        window.history.replaceState(null, document.title, window.location.href);
      }
    };
  }, [open, isMobile]);

  // Focus the search input when opening.
  React.useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Close on click outside (desktop) or Escape.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const currentIndex = filtered.findIndex((o) => o.value === value);
    let nextIndex: number;
    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
    }
    const nextValue = filtered[nextIndex]?.value;
    if (nextValue) {
      optionRefs.current[nextValue]?.focus();
    }
  };

  const trigger = (
    <Button
      type="button"
      id={triggerId}
      variant="outline"
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listboxId : undefined}
      aria-label={label}
      className="h-11 w-full justify-between bg-celis-surface-inset px-3 font-normal"
      onClick={() => setOpen((current) => !current)}
    >
      <span className={cn("truncate", !selected && "text-celis-ink-tertiary")}>
        {selected?.label ?? placeholder}
      </span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const searchInput = (
    <div className="relative border-b border-celis-border p-3">
      <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-celis-ink-tertiary" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          }
          if (event.key === "Enter" && filtered[0]) {
            event.preventDefault();
            selectOption(filtered[0].value);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            const first = filtered[0]?.value;
            if (first) optionRefs.current[first]?.focus();
          }
        }}
        placeholder={searchPlaceholder}
        className="h-10 bg-celis-surface-base pl-10"
        aria-label={searchPlaceholder}
      />
    </div>
  );

  const optionList = (
    <div
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-label={label ?? placeholder}
      aria-activedescendant={value ? `${listboxId}-${value}` : undefined}
      onKeyDown={handleListKeyDown}
      className="touch-pan-y overflow-y-auto p-2"
      style={{
        maxHeight: isMobile ? undefined : "16rem",
      }}
    >
      {filtered.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-celis-ink-secondary">
          {emptyMessage}
        </div>
      ) : (
        filtered.map((option) => (
          <button
            key={`${option.value}-${option.label}`}
            id={`${listboxId}-${option.value}`}
            ref={(el) => {
              optionRefs.current[option.value] = el;
            }}
            type="button"
            role="option"
            aria-selected={option.value === value}
            tabIndex={-1}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-3 py-3 text-left text-sm outline-none transition hover:bg-celis-primary-subtle focus:bg-celis-primary-subtle",
              option.value === value && "font-medium"
            )}
            onClick={() => selectOption(option.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectOption(option.value);
              }
            }}
          >
            <Check
              className={cn(
                "h-4 w-4 shrink-0",
                option.value === value ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="truncate">{option.label}</span>
          </button>
        ))
      )}
    </div>
  );

  // Mobile bottom-sheet rendering via portal.
  const mobileDropdown =
    isMobile && open
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-label={label ?? placeholder}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className="flex max-h-[80dvh] flex-col rounded-t-xl border-t border-celis-border bg-celis-surface-elevated shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between border-b border-celis-border px-3 py-2">
                <span className="text-sm font-medium text-celis-ink">
                  {label ?? placeholder}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {searchInput}
              <div className="flex-1 overflow-hidden">{optionList}</div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger}

      {/* Desktop inline dropdown */}
      {!isMobile && open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-celis-border bg-celis-surface-elevated text-celis-ink shadow-md">
          {searchInput}
          {optionList}
        </div>
      )}

      {mobileDropdown}
    </div>
  );
}
